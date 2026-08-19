import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { AuditAction, NotificationType, WithdrawalStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notificationService: NotificationService,
  ) {}

  // ==================== DASHBOARD ====================
  async getDashboard() {
    const [totalUsers, totalAgents, totalMerchants, totalTransactions, recentTransactions, pendingReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'AGENT' } }),
      this.prisma.user.count({ where: { role: 'COMMERCANT' } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, phone: true, name: true } },
          agent: { select: { id: true, phone: true, name: true } },
        },
      }),
      this.prisma.suspiciousReport.count({ where: { status: 'PENDING' } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: today } },
      select: { amount: true, type: true, status: true },
    });

    const todayStats = {
      count: todayTransactions.length,
      totalAmount: todayTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
      deposits: todayTransactions.filter(t => t.type === 'DEPOSIT').length,
      withdrawals: todayTransactions.filter(t => t.type === 'WITHDRAWAL').length,
    };

    return {
      totalUsers,
      totalAgents,
      totalMerchants,
      totalTransactions,
      pendingReports,
      todayStats,
      recentTransactions,
    };
  }

  // ==================== USERS ====================
  async getUsers(params: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { phone: { contains: params.q, mode: 'insensitive' } },
        { name: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, name: true, role: true, status: true,
          phoneVerified: true, accountValidated: true, createdAt: true, balance: true,
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: true,
        _count: {
          select: {
            clientTransactions: true,
            agentTransactions: true,
            notifications: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async getUserTransactions(userId: string, params?: { page?: number; limit?: number; type?: string; status?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ clientId: userId }, { agentId: userId }],
    };
    if (params?.type) where.type = params.type;
    if (params?.status) where.status = params.status;

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

    return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async suspendUser(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.role === 'SUPER_ADMIN') throw new BadRequestException('Impossible de suspendre un super admin');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.audit.log({
      actorId, action: AuditAction.USER_SUSPEND,
      targetId: userId, targetType: 'USER',
      details: { phone: user.phone, name: user.name }, ip,
    });

    return updated;
  }

  async reactivateUser(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.audit.log({
      actorId, action: AuditAction.USER_REACTIVATE,
      targetId: userId, targetType: 'USER',
      details: { phone: user.phone, name: user.name }, ip,
    });

    return updated;
  }

  // ==================== TRANSACTIONS ====================
  async getTransactions(params: { q?: string; type?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { id: { contains: params.q, mode: 'insensitive' } },
        { reference: { contains: params.q, mode: 'insensitive' } },
        { client: { phone: { contains: params.q, mode: 'insensitive' } } },
        { agent: { phone: { contains: params.q, mode: 'insensitive' } } },
      ];
    }
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }

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

    return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getTransactionDetail(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
          client: { select: { id: true, phone: true, name: true } },
        agent: { select: { id: true, phone: true, name: true } },
        commissionRecord: true,
        reports: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction non trouvée');
    return tx;
  }

  async flagTransaction(transactionId: string, reason: string, description: string | undefined, actorId: string, ip?: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction non trouvée');

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { flagged: true, flagReason: reason },
    });

    await this.audit.log({
      actorId, action: AuditAction.TRANSACTION_FLAG,
      targetId: transactionId, targetType: 'TRANSACTION',
      details: { reason, description }, ip,
    });

    return updated;
  }

  // ==================== AGENTS ====================
  async getAgents(params?: { q?: string; status?: string; validated?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: 'AGENT' };
    if (params?.status) where.status = params.status;
    if (params?.q) {
      where.OR = [
        { phone: { contains: params.q, mode: 'insensitive' } },
        { name: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [agents, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { agentProfile: true },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { agents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async validateAgent(userId: string, actorId: string, notes?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'AGENT') throw new NotFoundException('Agent non trouvé');

    const profile = await this.prisma.agentProfile.upsert({
      where: { userId },
      update: { validated: true, validatedBy: actorId, validatedAt: new Date(), notes },
      create: { userId, validated: true, validatedBy: actorId, validatedAt: new Date(), notes },
    });

    await this.audit.log({
      actorId, action: AuditAction.AGENT_VALIDATE,
      targetId: userId, targetType: 'AGENT',
      details: { phone: user.phone, notes }, ip,
    });

    return profile;
  }

  async suspendAgent(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'AGENT') throw new NotFoundException('Agent non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.audit.log({
      actorId, action: AuditAction.AGENT_SUSPEND,
      targetId: userId, targetType: 'AGENT',
      details: { phone: user.phone }, ip,
    });

    return updated;
  }

  async reactivateAgent(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'AGENT') throw new NotFoundException('Agent non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.audit.log({
      actorId, action: AuditAction.AGENT_REACTIVATE,
      targetId: userId, targetType: 'AGENT',
      details: { phone: user.phone }, ip,
    });

    return updated;
  }

  async updateAgentProfile(userId: string, data: { trainingComplete?: boolean; notes?: string }, actorId: string, ip?: string) {
    const profile = await this.prisma.agentProfile.update({
      where: { userId },
      data,
    });

    await this.audit.log({
      actorId, action: AuditAction.SETTINGS_UPDATE,
      targetId: userId, targetType: 'AGENT_PROFILE',
      details: data, ip,
    });

    return profile;
  }

  async getAgentCommissions(agentId: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (params?.from || params?.to) {
      where.calculatedAt = {};
      if (params?.from) where.calculatedAt.gte = new Date(params.from);
      if (params?.to) where.calculatedAt.lte = new Date(params.to);
    }

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: { transaction: { select: { id: true, type: true, amount: true, status: true } } },
        orderBy: { calculatedAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { commissions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ==================== MERCHANTS ====================
  async getMerchants(params?: { q?: string; status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: 'COMMERCANT' };
    if (params?.status) where.status = params.status;
    if (params?.q) {
      where.OR = [
        { phone: { contains: params.q, mode: 'insensitive' } },
        { name: { contains: params.q, mode: 'insensitive' } },
        { merchantProfile: { businessName: { contains: params.q, mode: 'insensitive' } } },
      ];
    }

    const [merchants, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { merchantProfile: true },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { merchants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async validateMerchant(userId: string, actorId: string, data?: { businessName?: string; businessType?: string; notes?: string }, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'COMMERCANT') throw new NotFoundException('Commerçant non trouvé');

    const profile = await this.prisma.merchantProfile.upsert({
      where: { userId },
      update: {
        validated: true, validatedBy: actorId, validatedAt: new Date(),
        ...(data?.businessName && { businessName: data.businessName }),
        ...(data?.businessType && { businessType: data.businessType }),
        ...(data?.notes && { notes: data.notes }),
      },
      create: {
        userId,
        businessName: data?.businessName || user.name || user.phone,
        validated: true, validatedBy: actorId, validatedAt: new Date(),
        businessType: data?.businessType,
        notes: data?.notes,
      },
    });

    await this.audit.log({
      actorId, action: AuditAction.MERCHANT_VALIDATE,
      targetId: userId, targetType: 'MERCHANT',
      details: { phone: user.phone, ...data }, ip,
    });

    return profile;
  }

  async suspendMerchant(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'COMMERCANT') throw new NotFoundException('Commerçant non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.audit.log({
      actorId, action: AuditAction.MERCHANT_SUSPEND,
      targetId: userId, targetType: 'MERCHANT',
      details: { phone: user.phone }, ip,
    });

    return updated;
  }

  async reactivateMerchant(userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'COMMERCANT') throw new NotFoundException('Commerçant non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.audit.log({
      actorId, action: AuditAction.MERCHANT_REACTIVATE,
      targetId: userId, targetType: 'MERCHANT',
      details: { phone: user.phone }, ip,
    });

    return updated;
  }

  async getMerchantPayments(userId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { merchantId: userId, type: 'PAYMENT' as const };
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ==================== REPORTS ====================
  async getReports(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) where.status = params.status;

    const [reports, total] = await Promise.all([
      this.prisma.suspiciousReport.findMany({
        where,
        include: {
          agent: { select: { id: true, phone: true, name: true } },
          transaction: { select: { id: true, type: true, amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.suspiciousReport.count({ where }),
    ]);

    return { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async reviewReport(reportId: string, status: string, actorId: string, ip?: string) {
    const report = await this.prisma.suspiciousReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Signalement non trouvé');

    const updated = await this.prisma.suspiciousReport.update({
      where: { id: reportId },
      data: {
        status: status as any,
        reviewedBy: actorId,
        reviewedAt: new Date(),
      },
    });

    const actionMap: Record<string, AuditAction> = {
      REVIEWED: AuditAction.REPORT_REVIEW,
      RESOLVED: AuditAction.REPORT_RESOLVE,
      DISMISSED: AuditAction.REPORT_DISMISS,
    };

    await this.audit.log({
      actorId, action: actionMap[status] || AuditAction.REPORT_REVIEW,
      targetId: reportId, targetType: 'SUSPICIOUS_REPORT',
      details: { status }, ip,
    });

    return updated;
  }

  // ==================== AUDIT ====================
  async getAuditLogs(params?: { actorId?: string; action?: string; from?: string; to?: string; page?: number; limit?: number }) {
    return this.audit.findAll({
      ...params,
      action: params?.action as AuditAction | undefined,
    });
  }

  // ==================== WITHDRAWALS ====================
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
}
