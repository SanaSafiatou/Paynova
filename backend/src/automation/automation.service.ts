import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ProviderRegistry } from '../external-api/providers/provider.registry';
import { NotificationType, TransactionStatus, WithdrawalStatus } from '@prisma/client';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger('AutomationService');

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private providerRegistry: ProviderRegistry,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyReport() {
    this.logger.log('[DAILY REPORT] Starting...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [transactions, totalAmount, newUsers, newMerchants] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: { createdAt: { gte: yesterday, lt: today }, status: TransactionStatus.SUCCESS },
        _count: true,
        _sum: { amount: true, fees: true },
      }),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: yesterday, lt: today }, status: TransactionStatus.SUCCESS },
        _sum: { amount: true, fees: true },
        _count: true,
      }),
      this.prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      this.prisma.user.count({ where: { role: 'COMMERCANT', createdAt: { gte: yesterday, lt: today } } }),
    ]);

    this.logger.log(
      `[DAILY REPORT] ${totalAmount._count} tx, ` +
      `${Number(totalAmount._sum.amount || 0)} FCFA, ` +
      `${Number(totalAmount._sum.fees || 0)} fees, ` +
      `${newUsers} users, ${newMerchants} merchants`,
    );

    return {
      date: yesterday.toISOString().split('T')[0],
      transactions: totalAmount._count,
      totalAmount: Number(totalAmount._sum.amount || 0),
      totalFees: Number(totalAmount._sum.fees || 0),
      byType: transactions,
      newUsers,
      newMerchants,
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async unlockExpiredPinLockouts() {
    const now = new Date();
    const result = await this.prisma.user.updateMany({
      where: { pinLockedUntil: { not: null, lt: now } },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });

    if (result.count > 0) {
      this.logger.log(`[PIN UNLOCK] ${result.count} lockouts expired`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processApprovedWithdrawals() {
    const approved = await this.prisma.withdrawalRequest.findMany({
      where: { status: WithdrawalStatus.APPROUVE },
    });

    if (approved.length === 0) return;

    this.logger.log(`[WITHDRAWAL] ${approved.length} approved withdrawals to process`);

    for (const withdrawal of approved) {
      try {
        const merchant = await this.prisma.user.findUnique({
          where: { id: withdrawal.merchantId },
          select: { phone: true, name: true },
        });

        const provider = this.providerRegistry.getCredit();
        const result = await provider.buyCredit(
          merchant?.phone || '',
          Number(withdrawal.amount),
        );

        if (result.success) {
          await this.prisma.withdrawalRequest.update({
            where: { id: withdrawal.id },
            data: { status: WithdrawalStatus.TERMINE, processedAt: new Date() },
          });

          await this.notificationService.create(
            withdrawal.merchantId,
            'Retrait terminé',
            `Votre retrait de ${withdrawal.amount} FCFA a été viré avec succès.`,
            NotificationType.TRANSACTION,
          );

          this.logger.log(`[WITHDRAWAL] ${withdrawal.id} → TERMINE (${withdrawal.amount} FCFA)`);
        } else {
          await this.prisma.withdrawalRequest.update({
            where: { id: withdrawal.id },
            data: { status: WithdrawalStatus.REFUSE, note: `Échec transfert: ${result.error}` },
          });

          const profile = await this.prisma.merchantProfile.findFirst({
            where: { userId: withdrawal.merchantId },
          });
          if (profile) {
            await this.prisma.merchantProfile.update({
              where: { id: profile.id },
              data: { balance: { increment: withdrawal.amount } },
            });
          }

          await this.notificationService.create(
            withdrawal.merchantId,
            'Retrait échoué',
            `Le transfert de ${withdrawal.amount} FCFA a échoué. Montant remboursé.`,
            NotificationType.ALERT,
          );

          this.logger.warn(`[WITHDRAWAL] ${withdrawal.id} → REFUSE (transfer failed, refunded)`);
        }
      } catch (error) {
        this.logger.error(`[WITHDRAWAL] ${withdrawal.id} error: ${error.message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredSessions() {
    const now = new Date();
    const result = await this.prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: now }, revokedAt: null },
    });

    if (result.count > 0) {
      this.logger.log(`[SESSION CLEANUP] ${result.count} expired sessions deleted`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async archiveOldAuditLogs() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const count = await this.prisma.auditLog.count({
      where: { createdAt: { lt: sixMonthsAgo } },
    });

    if (count > 0) {
      await this.prisma.auditLog.deleteMany({
        where: { createdAt: { lt: sixMonthsAgo } },
      });
      this.logger.log(`[AUDIT CLEANUP] ${count} audit logs archived (> 6 months)`);
    }
  }
}
