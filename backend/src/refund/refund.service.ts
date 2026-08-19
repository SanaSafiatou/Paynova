import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { AuditAction, NotificationType, RefundStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notificationService: NotificationService,
  ) {}

  private generateRefundReference(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = randomBytes(4).toString('hex').toUpperCase();
    return `RBF-${ts}-${rand}`;
  }

  async searchTransaction(q: string) {
    const txs = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { reference: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        client: { select: { id: true, phone: true, name: true, balance: true } },
        agent: { select: { id: true, phone: true, name: true, balance: true } },
        merchant: { select: { id: true, phone: true, name: true, balance: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return txs;
  }

  async requestRefund(data: {
    transactionId: string;
    refundAmount: number;
    reason: string;
    debitUserId: string;
    creditUserId: string;
    note?: string;
    adminId: string;
    ip?: string;
  }) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        client: { select: { id: true, phone: true, name: true } },
        agent: { select: { id: true, phone: true, name: true } },
        merchant: { select: { id: true, phone: true, name: true } },
        refunds: { where: { status: { not: 'REFUSED' } } },
      },
    });
    if (!tx) throw new NotFoundException('Transaction non trouvée');
    if (tx.status !== 'SUCCESS') throw new BadRequestException('Seules les transactions réussies peuvent être remboursées');
    if (data.refundAmount <= 0) throw new BadRequestException('Le montant doit être supérieur à 0');
    if (data.refundAmount > Number(tx.amount)) throw new BadRequestException('Le remboursement ne peut pas dépasser le montant de la transaction');

    const existingActive = tx.refunds.find(
      (r) => r.status === 'PENDING' || r.status === 'APPROVED',
    );
    if (existingActive) throw new BadRequestException('Un remboursement est déjà en cours pour cette transaction');

    const debitUser = await this.prisma.user.findUnique({ where: { id: data.debitUserId } });
    if (!debitUser) throw new NotFoundException('Compte à débiter non trouvé');

    const creditUser = await this.prisma.user.findUnique({ where: { id: data.creditUserId } });
    if (!creditUser) throw new NotFoundException('Compte à créditer non trouvé');

    const refund = await this.prisma.refund.create({
      data: {
        transactionId: data.transactionId,
        originalAmount: tx.amount,
        originalFees: tx.fees,
        refundAmount: data.refundAmount,
        reason: data.reason,
        status: 'PENDING',
        debitUserId: data.debitUserId,
        creditUserId: data.creditUserId,
        adminId: data.adminId,
        refundReference: this.generateRefundReference(),
        originalReference: tx.reference,
        note: data.note,
      },
      include: {
        transaction: {
          include: {
            client: { select: { id: true, phone: true, name: true } },
            agent: { select: { id: true, phone: true, name: true } },
            merchant: { select: { id: true, phone: true, name: true } },
          },
        },
        admin: { select: { id: true, phone: true, name: true } },
        debitUser: { select: { id: true, phone: true, name: true } },
        creditUser: { select: { id: true, phone: true, name: true } },
      },
    });

    await this.audit.log({
      actorId: data.adminId,
      action: AuditAction.REFUND_REQUEST,
      targetId: refund.id,
      targetType: 'REFUND',
      details: {
        transactionId: data.transactionId,
        originalReference: tx.reference,
        refundAmount: data.refundAmount,
        reason: data.reason,
        debitUserId: data.debitUserId,
        creditUserId: data.creditUserId,
        refundReference: refund.refundReference,
      },
      ip: data.ip,
    });

    return refund;
  }

  async listRefunds(params: {
    status?: string;
    page?: number;
    limit?: number;
    q?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { refundReference: { contains: params.q, mode: 'insensitive' } },
        { originalReference: { contains: params.q, mode: 'insensitive' } },
        { reason: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          transaction: { select: { id: true, type: true, amount: true, status: true, reference: true } },
          admin: { select: { id: true, phone: true, name: true } },
          debitUser: { select: { id: true, phone: true, name: true } },
          creditUser: { select: { id: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { refunds, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getRefundDetail(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            client: { select: { id: true, phone: true, name: true, balance: true } },
            agent: { select: { id: true, phone: true, name: true, balance: true } },
            merchant: { select: { id: true, phone: true, name: true, balance: true } },
          },
        },
        admin: { select: { id: true, phone: true, name: true } },
        debitUser: { select: { id: true, phone: true, name: true, balance: true } },
        creditUser: { select: { id: true, phone: true, name: true, balance: true } },
      },
    });
    if (!refund) throw new NotFoundException('Remboursement non trouvé');
    return refund;
  }

  async approveRefund(id: string, actorId: string, note?: string, ip?: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Remboursement non trouvé');
    if (refund.status !== 'PENDING') throw new BadRequestException('Ce remboursement ne peut plus être approuvé');

    const updated = await this.prisma.refund.update({
      where: { id },
      data: { status: 'APPROVED', note: note || refund.note },
      include: {
        transaction: { select: { id: true, type: true, amount: true, reference: true } },
        admin: { select: { id: true, phone: true, name: true } },
        debitUser: { select: { id: true, phone: true, name: true } },
        creditUser: { select: { id: true, phone: true, name: true } },
      },
    });

    await this.audit.log({
      actorId,
      action: AuditAction.REFUND_APPROVE,
      targetId: id,
      targetType: 'REFUND',
      details: {
        refundReference: refund.refundReference,
        transactionId: refund.transactionId,
        refundAmount: Number(refund.refundAmount),
        note,
      },
      ip,
    });

    return updated;
  }

  async refuseRefund(id: string, actorId: string, note?: string, ip?: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Remboursement non trouvé');
    if (refund.status !== 'PENDING' && refund.status !== 'APPROVED') {
      throw new BadRequestException('Ce remboursement ne peut plus être refusé');
    }

    const updated = await this.prisma.refund.update({
      where: { id },
      data: { status: 'REFUSED', note: note || refund.note },
      include: {
        transaction: { select: { id: true, type: true, amount: true, reference: true } },
        admin: { select: { id: true, phone: true, name: true } },
        debitUser: { select: { id: true, phone: true, name: true } },
        creditUser: { select: { id: true, phone: true, name: true } },
      },
    });

    await this.audit.log({
      actorId,
      action: AuditAction.REFUND_REFUSE,
      targetId: id,
      targetType: 'REFUND',
      details: {
        refundReference: refund.refundReference,
        transactionId: refund.transactionId,
        refundAmount: Number(refund.refundAmount),
        note,
      },
      ip,
    });

    return updated;
  }

  async executeRefund(id: string, actorId: string, ip?: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Remboursement non trouvé');
    if (refund.status !== 'APPROVED') throw new BadRequestException('Seuls les remboursements approuvés peuvent être exécutés');
    if (!refund.debitUserId || !refund.creditUserId) {
      throw new BadRequestException('Comptes de débit/crédit non configurés');
    }

    const debitUser = await this.prisma.user.findUnique({ where: { id: refund.debitUserId } });
    if (!debitUser) throw new NotFoundException('Compte à débiter non trouvé');
    if (Number(debitUser.balance) < Number(refund.refundAmount)) {
      throw new BadRequestException(`Solde insuffisant sur le compte à débiter (${Number(debitUser.balance)} FCFA disponibles)`);
    }

    const creditUser = await this.prisma.user.findUnique({ where: { id: refund.creditUserId } });
    if (!creditUser) throw new NotFoundException('Compte à créditer non trouvé');

    const txResult = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: refund.debitUserId! },
        data: { balance: { decrement: refund.refundAmount } },
      });

      await tx.user.update({
        where: { id: refund.creditUserId! },
        data: { balance: { increment: refund.refundAmount } },
      });

      const updated = await tx.refund.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          executedAt: new Date(),
        },
        include: {
          transaction: { select: { id: true, type: true, amount: true, reference: true } },
          admin: { select: { id: true, phone: true, name: true } },
          debitUser: { select: { id: true, phone: true, name: true, balance: true } },
          creditUser: { select: { id: true, phone: true, name: true, balance: true } },
        },
      });

      return updated;
    });

    await this.audit.log({
      actorId,
      action: AuditAction.REFUND_EXECUTE,
      targetId: id,
      targetType: 'REFUND',
      details: {
        refundReference: refund.refundReference,
        transactionId: refund.transactionId,
        originalReference: refund.originalReference,
        refundAmount: Number(refund.refundAmount),
        debitUserId: refund.debitUserId,
        debitUserName: debitUser.name || debitUser.phone,
        creditUserId: refund.creditUserId,
        creditUserName: creditUser.name || creditUser.phone,
        debitBalanceAfter: Number(debitUser.balance) - Number(refund.refundAmount),
        creditBalanceAfter: Number(creditUser.balance) + Number(refund.refundAmount),
      },
      ip,
    });

    await this.notificationService.create(
      refund.creditUserId!,
      'Remboursement reçu',
      `Un remboursement de ${refund.refundAmount} FCFA a été crédité sur votre compte (réf: ${refund.refundReference}).`,
      NotificationType.TRANSACTION,
    );

    return txResult;
  }

  async getRefundStats() {
    const [pending, approved, refused, completed, totalAmount] = await Promise.all([
      this.prisma.refund.count({ where: { status: 'PENDING' } }),
      this.prisma.refund.count({ where: { status: 'APPROVED' } }),
      this.prisma.refund.count({ where: { status: 'REFUSED' } }),
      this.prisma.refund.count({ where: { status: 'COMPLETED' } }),
      this.prisma.refund.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { refundAmount: true },
      }),
    ]);

    return {
      pending,
      approved,
      refused,
      completed,
      totalRefunded: Number(totalAmount._sum.refundAmount || 0),
    };
  }
}
