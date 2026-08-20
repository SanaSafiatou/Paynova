import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionType, TransactionStatus, NotificationType } from '@prisma/client';
import { CreateTransferDto } from './dto/transfer.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
    private readonly notificationService: NotificationService,
  ) {}

  async transfer(senderId: string, dto: CreateTransferDto) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Expéditeur introuvable');
    }

    if (sender.role !== 'CLIENT') {
      throw new BadRequestException('Seuls les clients peuvent effectuer des transferts');
    }

    if (sender.status !== 'ACTIVE') {
      throw new BadRequestException('Votre compte est suspendu');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { phone: dto.recipientPhone },
    });

    if (!recipient) {
      throw new NotFoundException(
        'Aucun compte trouvé avec ce numéro de téléphone',
      );
    }

    if (recipient.role !== 'CLIENT') {
      throw new BadRequestException(
        'Ce numéro n\'est pas associé à un compte client',
      );
    }

    if (sender.id === recipient.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas transférer de l\'argent à vous-même',
      );
    }

    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0');
    }

    const minTransferSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'limits.minTransfer' },
    });
    const minTransfer = minTransferSetting
      ? Number(minTransferSetting.value)
      : 500;

    if (dto.amount < minTransfer) {
      throw new BadRequestException(
        `Le montant minimum de transfert est de ${minTransfer} FCFA`,
      );
    }

    const calc = await this.commissionService.calculate(
      TransactionType.TRANSFER,
      dto.amount,
    );
    const totalDebit = dto.amount + calc.fees;

    if (Number(sender.balance) < totalDebit) {
      throw new BadRequestException(
        `Solde insuffisant. Solde actuel: ${Number(sender.balance)} FCFA, Montant requis: ${totalDebit} FCFA (dont ${calc.fees} FCFA de frais)`,
      );
    }

    const dailyTransferSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'limits.dailyTransfer' },
    });
    const dailyLimit = dailyTransferSetting
      ? Number(dailyTransferSetting.value)
      : 500000;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTransfers = await this.prisma.transaction.aggregate({
      where: {
        senderId,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const todayTotal = Number(todayTransfers._sum.amount || 0);
    if (todayTotal + dto.amount > dailyLimit) {
      throw new BadRequestException(
        `Plafond journalier de transfert dépassé. Limite: ${dailyLimit} FCFA, déjà utilisé: ${todayTotal} FCFA`,
      );
    }

    const reference = dto.reference || randomUUID();

    if (dto.reference) {
      const existingRef = await this.prisma.transaction.findUnique({
        where: { reference: dto.reference },
      });
      if (existingRef) {
        throw new BadRequestException('Cette référence de transaction existe déjà');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount: dto.amount,
          fees: calc.fees,
          commission: calc.commission,
          netAmount: calc.netAmount,
          status: TransactionStatus.SUCCESS,
          description: dto.description || `Transfert de ${dto.amount} FCFA à ${recipient.name || recipient.phone}`,
          clientId: senderId,
          senderId,
          recipientId: recipient.id,
          reference,
        },
      });

      await tx.user.update({
        where: { id: senderId },
        data: { balance: { decrement: totalDebit } },
      });

      await tx.user.update({
        where: { id: recipient.id },
        data: { balance: { increment: calc.netAmount } },
      });

      return transaction;
    });

    await this.notificationService.create(
      senderId,
      'Transfert effectué',
      `Transfert de ${dto.amount} FCFA effectué à ${recipient.name || recipient.phone}. Frais: ${calc.fees} FCFA.`,
      NotificationType.TRANSACTION,
    );

    await this.notificationService.create(
      recipient.id,
      'Transfert reçu',
      `${dto.amount} FCFA reçus de ${sender.name || sender.phone}.`,
      NotificationType.TRANSACTION,
    );

    return {
      transaction: {
        id: result.id,
        type: result.type,
        amount: Number(result.amount),
        fees: Number(result.fees),
        netAmount: Number(result.netAmount),
        status: result.status,
        reference: result.reference,
        description: result.description,
        createdAt: result.createdAt,
      },
      recipient: {
        id: recipient.id,
        name: recipient.name,
        phone: recipient.phone,
      },
    };
  }
}
