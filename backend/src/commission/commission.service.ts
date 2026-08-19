import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

export interface CommissionCalculation {
  fees: number;
  commission: number;
  netAmount: number;
}

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(type: TransactionType, amount: number): Promise<CommissionCalculation> {
    const rule = await this.prisma.commissionRule.findFirst({
      where: {
        type,
        isActive: true,
        minAmount: { lte: amount },
        maxAmount: { gte: amount },
      },
      orderBy: { minAmount: 'asc' },
    });

    if (!rule) {
      return { fees: 0, commission: 0, netAmount: amount };
    }

    const rateAmount = Number(rule.rate) * amount;
    const fees = Math.max(Number(rule.fixedAmount), rateAmount);
    const commission = fees * 0.30;
    const netAmount = amount - fees;

    return {
      fees: Math.round(fees * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  async findAll() {
    return this.prisma.commissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.commissionRule.findUnique({ where: { id } });
  }

  async create(data: {
    type: TransactionType;
    minAmount: number;
    maxAmount: number;
    rate: number;
    fixedAmount?: number;
  }) {
    return this.prisma.commissionRule.create({ data });
  }

  async update(id: string, data: {
    type?: TransactionType;
    minAmount?: number;
    maxAmount?: number;
    rate?: number;
    fixedAmount?: number;
    isActive?: boolean;
  }) {
    return this.prisma.commissionRule.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.commissionRule.delete({ where: { id } });
  }
}
