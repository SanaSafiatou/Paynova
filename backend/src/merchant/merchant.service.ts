import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import {
  AuditAction, TransactionType, TransactionStatus, NotificationType, WithdrawalStatus,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private notificationService: NotificationService,
    private audit: AuditService,
  ) {}

  private async ensureMerchant(userId: string, opts?: { allowUnvalidated?: boolean }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { merchantProfile: true },
    });
    if (!user || user.role !== 'COMMERCANT') {
      throw new ForbiddenException('Accès réservé aux commerçants');
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Votre compte est suspendu');
    }
    if (!opts?.allowUnvalidated && !user.merchantProfile?.validated) {
      throw new ForbiddenException('Votre compte commerçant n\'est pas encore validé');
    }
    return { user, profile: user.merchantProfile! };
  }

  async getProfile(userId: string) {
    const { user, profile } = await this.ensureMerchant(userId, { allowUnvalidated: true });
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      status: user.status,
      balance: Number(user.balance),
      merchantProfile: {
        id: profile.id,
        businessName: profile.businessName,
        businessType: profile.businessType,
        businessAddress: profile.businessAddress,
        merchantCode: profile.merchantCode,
        balance: Number(profile.balance),
        validated: profile.validated,
        createdAt: profile.createdAt,
      },
    };
  }

  async updateProfile(userId: string, data: { businessName?: string; businessType?: string; businessAddress?: string }) {
    const { profile } = await this.ensureMerchant(userId, { allowUnvalidated: true });
    return this.prisma.merchantProfile.update({
      where: { id: profile.id },
      data: {
        ...(data.businessName !== undefined && data.businessName.trim() && { businessName: data.businessName.trim() }),
        ...(data.businessType !== undefined && { businessType: data.businessType }),
        ...(data.businessAddress !== undefined && { businessAddress: data.businessAddress }),
      },
    });
  }

  async getQrCode(userId: string) {
    const { profile } = await this.ensureMerchant(userId);

    if (!profile.merchantCode || !profile.qrData) {
      const merchantCode = `MCH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const qrData = JSON.stringify({
        type: 'MERCHANT',
        merchantCode,
        merchantId: userId,
        businessName: profile.businessName,
      });

      await this.prisma.merchantProfile.update({
        where: { id: profile.id },
        data: { merchantCode, qrData },
      });

      return { merchantCode, qrData, businessName: profile.businessName };
    }

    return {
      merchantCode: profile.merchantCode,
      qrData: profile.qrData,
      businessName: profile.businessName,
    };
  }

  async getSales(userId: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
    await this.ensureMerchant(userId);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      merchantId: userId,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.SUCCESS,
    };
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params?.from) where.createdAt.gte = new Date(params.from);
      if (params?.to) where.createdAt.lte = new Date(params.to);
    }

    const [sales, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          client: { select: { id: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      sales: sales.map((s) => ({
        ...s,
        amount: Number(s.amount),
        fees: Number(s.fees),
        netAmount: Number(s.netAmount),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getHistory(userId: string, params?: { type?: string; page?: number; limit?: number }) {
    await this.ensureMerchant(userId);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: TransactionStatus.SUCCESS,
      OR: [{ merchantId: userId }, { clientId: userId }],
    };
    if (params?.type) where.type = params.type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          client: { select: { id: true, phone: true, name: true } },
          agent: { select: { id: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        fees: Number(t.fees),
        netAmount: Number(t.netAmount),
        isCredit: t.merchantId === userId,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getStats(userId: string, params?: { period?: string }) {
    await this.ensureMerchant(userId);
    const now = new Date();
    let from: Date;

    switch (params?.period) {
      case 'week': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'year': from = new Date(now.getFullYear(), 0, 1); break;
      default: from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    }

    const baseWhere = {
      merchantId: userId,
      status: TransactionStatus.SUCCESS,
      createdAt: { gte: from, lte: now },
    };

    const [totalReceived, dailySales] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.PAYMENT },
        _sum: { amount: true, fees: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ['createdAt'],
        where: { ...baseWhere, type: TransactionType.PAYMENT },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const dailyMap = new Map<string, { count: number; total: number }>();
    for (const d of dailySales) {
      const key = new Date(d.createdAt).toISOString().split('T')[0];
      const existing = dailyMap.get(key) || { count: 0, total: 0 };
      dailyMap.set(key, {
        count: existing.count + d._count,
        total: existing.total + Number(d._sum.amount || 0),
      });
    }
    const dailySalesArr = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, count: v.count, total: v.total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgDaily = dailySalesArr.length > 0
      ? dailySalesArr.reduce((s, d) => s + d.total, 0) / dailySalesArr.length
      : 0;

    return {
      period: params?.period || 'month',
      periodStart: from,
      periodEnd: now,
      totalSales: totalReceived._count,
      totalAmount: Number(totalReceived._sum.amount || 0),
      totalFees: Number(totalReceived._sum.fees || 0),
      netAmount: Number(totalReceived._sum.amount || 0) - Number(totalReceived._sum.fees || 0),
      averageDaily: Math.round(avgDaily),
      dailySales: dailySalesArr,
    };
  }

  async requestWithdrawal(userId: string, amount: number, note?: string) {
    const { profile } = await this.ensureMerchant(userId);

    const result = await this.prisma.$transaction(async (tx) => {
      const freshProfile = await tx.merchantProfile.findUnique({
        where: { id: profile.id },
      });
      if (!freshProfile) throw new NotFoundException('Profil marchand introuvable');
      if (Number(freshProfile.balance) < amount) {
        throw new BadRequestException('Solde insuffisant');
      }

      await tx.merchantProfile.update({
        where: { id: profile.id },
        data: { balance: { decrement: amount } },
      });

      return tx.withdrawalRequest.create({
        data: { merchantId: userId, amount, note },
      });
    });

    await this.notificationService.create(
      userId,
      'Demande de retrait',
      `Votre demande de retrait de ${amount} FCFA a été envoyée. Statut: en attente.`,
      NotificationType.TRANSACTION,
    );

    return result;
  }

  async getWithdrawals(userId: string, params?: { status?: string; page?: number; limit?: number }) {
    await this.ensureMerchant(userId);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { merchantId: userId };
    if (params?.status) where.status = params.status;

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return { withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getBalance(userId: string) {
    const { user, profile } = await this.ensureMerchant(userId);
    return {
      mainBalance: Number(user.balance),
      merchantBalance: Number(profile.balance),
      merchantCode: profile.merchantCode,
    };
  }

  async receivePayment(data: {
    merchantCode: string;
    clientPhone: string;
    amount: number;
    description?: string;
    agentId?: string;
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0');
    }

    const profile = await this.prisma.merchantProfile.findUnique({
      where: { merchantCode: data.merchantCode },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Code marchand non trouvé');
    if (!profile.validated) throw new ForbiddenException('Compte marchand non validé');
    if (profile.user.status === 'SUSPENDED') throw new ForbiddenException('Compte marchand suspendu');

    const client = await this.prisma.user.findUnique({
      where: { phone: data.clientPhone },
    });
    if (!client) throw new NotFoundException('Client non trouvé');

    const calc = await this.commissionService.calculate(TransactionType.PAYMENT, data.amount);
    const totalDebit = data.amount;
    if (Number(client.balance) < totalDebit) {
      throw new BadRequestException(
        `Solde client insuffisant. Disponible: ${Number(client.balance)} FCFA, Requis: ${totalDebit} FCFA`,
      );
    }

    const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: client.id },
        data: { balance: { decrement: totalDebit } },
      });

      await tx.merchantProfile.update({
        where: { id: profile.id },
        data: { balance: { increment: calc.netAmount } },
      });

      return tx.transaction.create({
        data: {
          type: TransactionType.PAYMENT,
          amount: data.amount,
          fees: calc.fees,
          commission: calc.commission,
          netAmount: calc.netAmount,
          status: TransactionStatus.SUCCESS,
          description: data.description || `Paiement chez ${profile.businessName}`,
          clientId: client.id,
          merchantId: profile.userId,
          agentId: data.agentId,
          reference,
        },
      });
    });

    if (calc.commission > 0 && data.agentId) {
      await this.prisma.commission.create({
        data: {
          agentId: data.agentId,
          transactionId: transaction.id,
          amount: calc.commission,
        },
      });
    }

    await this.notificationService.create(
      client.id,
      'Paiement effectué',
      `Paiement de ${data.amount} FCFA effectué chez ${profile.businessName}. Frais: ${calc.fees} FCFA.`,
      NotificationType.TRANSACTION,
    );

    await this.notificationService.create(
      profile.userId,
      'Paiement reçu',
      `Vous avez reçu ${calc.netAmount} FCFA de ${client.name || data.clientPhone}. Référence: ${reference}`,
      NotificationType.TRANSACTION,
    );

    return {
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        fees: Number(transaction.fees),
        commission: Number(transaction.commission),
        netAmount: Number(transaction.netAmount),
        reference: transaction.reference,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      merchant: {
        businessName: profile.businessName,
        merchantCode: profile.merchantCode,
      },
      client: {
        id: client.id,
        phone: client.phone,
        name: client.name,
      },
    };
  }

  async processWithdrawal(withdrawalId: string, status: string, processedBy: string, note?: string, ip?: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal) throw new NotFoundException('Demande de retrait non trouvée');
    if (withdrawal.status !== 'EN_ATTENTE') throw new BadRequestException('Cette demande a déjà été traitée');

    const auditAction = status === WithdrawalStatus.APPROUVE || status === WithdrawalStatus.TERMINE
      ? AuditAction.WITHDRAWAL_APPROVE
      : AuditAction.WITHDRAWAL_REFUSE;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: status as any, processedBy, processedAt: new Date(), note },
      });

      if (status === 'REFUSE') {
        const profile = await tx.merchantProfile.findFirst({
          where: { userId: withdrawal.merchantId },
        });
        if (profile) {
          await tx.merchantProfile.update({
            where: { id: profile.id },
            data: { balance: { increment: withdrawal.amount } },
          });
        }
      }

      return updated;
    });

    await this.audit.log({
      actorId: processedBy,
      action: auditAction,
      targetId: withdrawalId,
      targetType: 'WITHDRAWAL_REQUEST',
      details: { status, amount: Number(withdrawal.amount), merchantId: withdrawal.merchantId, note },
      ip,
    });

    const statusLabel = status === 'APPROUVE' ? 'approuvé' : status === 'REFUSE' ? 'refusé' : status === 'TERMINE' ? 'terminé' : status;
    await this.notificationService.create(
      withdrawal.merchantId,
      'Retrait ' + statusLabel,
      `Votre retrait de ${withdrawal.amount} FCFA a été ${statusLabel}.${note ? ' Note: ' + note : ''}`,
      NotificationType.TRANSACTION,
    );

    return result;
  }

  async getPendingWithdrawals(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { status: 'EN_ATTENTE' as const };

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: {
          merchant: { select: { id: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return { withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
