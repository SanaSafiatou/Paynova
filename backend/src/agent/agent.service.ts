import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { NotificationService } from '../notification/notification.service';
import {
  TransactionType,
  TransactionStatus,
  NotificationType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
    private readonly notificationService: NotificationService,
  ) {}

  async identifyClient(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        balance: true,
        phoneVerified: true,
        profileComplete: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Aucun client trouvé avec ce numéro');
    }

    if (user.role !== 'CLIENT') {
      throw new BadRequestException('Ce numéro n\'est pas associé à un compte client');
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name || 'Client non renseigné',
      balance: Number(user.balance),
      phoneVerified: user.phoneVerified,
      profileComplete: user.profileComplete,
    };
  }

  async deposit(agentId: string, clientPhone: string, amount: number, description?: string) {
    const client = await this.prisma.user.findUnique({
      where: { phone: clientPhone },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (client.role !== 'CLIENT') {
      throw new BadRequestException('Ce numéro n\'est pas un compte client');
    }

    const calc = await this.commissionService.calculate(TransactionType.DEPOSIT, amount);

    const transaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.DEPOSIT,
        amount,
        fees: calc.fees,
        commission: calc.commission,
        netAmount: calc.netAmount,
        status: TransactionStatus.SUCCESS,
        description: description || `Dépôt de ${amount} FCFA`,
        clientId: client.id,
        agentId,
      },
    });

    await this.prisma.user.update({
      where: { id: client.id },
      data: { balance: { increment: calc.netAmount } },
    });

    if (calc.commission > 0) {
      await this.prisma.commission.create({
        data: {
          agentId,
          transactionId: transaction.id,
          amount: calc.commission,
        },
      });
    }

    await this.notificationService.create(
      client.id,
      'Dépôt reçu',
      `${amount} FCFA ont été déposés sur votre compte par un agent.`,
      NotificationType.TRANSACTION,
    );

    await this.notificationService.create(
      agentId,
      'Dépôt effectué',
      `Dépôt de ${amount} FCFA effectué pour ${client.name || clientPhone}. Commission: ${calc.commission} FCFA.`,
      NotificationType.COMMISSION,
    );

    return {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        fees: Number(transaction.fees),
        commission: Number(transaction.commission),
        netAmount: Number(transaction.netAmount),
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        newBalance: Number(client.balance) + calc.netAmount,
      },
    };
  }

  async withdrawal(agentId: string, clientPhone: string, amount: number, description?: string) {
    const client = await this.prisma.user.findUnique({
      where: { phone: clientPhone },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (client.role !== 'CLIENT') {
      throw new BadRequestException('Ce numéro n\'est pas un compte client');
    }

    const calc = await this.commissionService.calculate(TransactionType.WITHDRAWAL, amount);
    const totalDebit = amount + calc.fees;

    if (Number(client.balance) < totalDebit) {
      throw new BadRequestException(
        `Solde insuffisant. Solde actuel: ${Number(client.balance)} FCFA, Montant requis: ${totalDebit} FCFA`,
      );
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.WITHDRAWAL,
        amount,
        fees: calc.fees,
        commission: calc.commission,
        netAmount: amount,
        status: TransactionStatus.SUCCESS,
        description: description || `Retrait de ${amount} FCFA`,
        clientId: client.id,
        agentId,
      },
    });

    await this.prisma.user.update({
      where: { id: client.id },
      data: { balance: { decrement: totalDebit } },
    });

    if (calc.commission > 0) {
      await this.prisma.commission.create({
        data: {
          agentId,
          transactionId: transaction.id,
          amount: calc.commission,
        },
      });
    }

    await this.notificationService.create(
      client.id,
      'Retrait effectué',
      `${amount} FCFA ont été retirés de votre compte par un agent. Frais: ${calc.fees} FCFA.`,
      NotificationType.TRANSACTION,
    );

    await this.notificationService.create(
      agentId,
      'Retrait effectué',
      `Retrait de ${amount} FCFA pour ${client.name || clientPhone}. Commission: ${calc.commission} FCFA.`,
      NotificationType.COMMISSION,
    );

    return {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        fees: Number(transaction.fees),
        commission: Number(transaction.commission),
        netAmount: Number(transaction.netAmount),
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        newBalance: Number(client.balance) - totalDebit,
      },
    };
  }

  async history(agentId: string, filters: {
    type?: TransactionType;
    status?: TransactionStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { agentId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.createdAt.lte = new Date(filters.to);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          commissionRecord: { select: { amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        fees: Number(t.fees),
        commission: Number(t.commission),
        netAmount: Number(t.netAmount),
        status: t.status,
        description: t.description,
        client: t.client,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async commissions(agentId: string, from?: string, to?: string) {
    const where: any = { agentId };

    if (from || to) {
      where.calculatedAt = {};
      if (from) {
        where.calculatedAt.gte = new Date(from);
      }
      if (to) {
        where.calculatedAt.lte = new Date(to);
      }
    }

    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    const total = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    return {
      commissions: commissions.map((c) => ({
        id: c.id,
        amount: Number(c.amount),
        transaction: {
          id: c.transaction.id,
          type: c.transaction.type,
          amount: Number(c.transaction.amount),
          status: c.transaction.status,
        },
        calculatedAt: c.calculatedAt,
      })),
      total,
    };
  }

  async stats(agentId: string, period: string = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const where = {
      agentId,
      status: TransactionStatus.SUCCESS,
      createdAt: { gte: startDate },
    };

    const [deposits, withdrawals, commissions, totalOps] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.DEPOSIT },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.WITHDRAWAL },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: {
          agentId,
          calculatedAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      period,
      startDate,
      endDate: now,
      deposits: {
        count: deposits._count,
        total: Number(deposits._sum.amount || 0),
      },
      withdrawals: {
        count: withdrawals._count,
        total: Number(withdrawals._sum.amount || 0),
      },
      commissions: {
        total: Number(commissions._sum.amount || 0),
      },
      totalOperations: totalOps,
    };
  }

  async reportSuspect(agentId: string, transactionId: string, reason: string, description?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction introuvable');
    }

    const report = await this.prisma.suspiciousReport.create({
      data: {
        agentId,
        transactionId,
        reason,
        description,
      },
    });

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.REPORTED },
    });

    await this.notificationService.create(
      agentId,
      'Signalement envoyé',
      `Votre signalement pour la transaction ${transactionId} a été enregistré.`,
      NotificationType.ALERT,
    );

    return report;
  }
}
