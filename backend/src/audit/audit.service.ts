import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId: string;
    action: AuditAction;
    targetId?: string;
    targetType?: string;
    details?: Record<string, any>;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetId: params.targetId,
        targetType: params.targetType,
        details: params.details || {},
        ip: params.ip,
      },
    });
  }

  async findAll(params?: { actorId?: string; action?: AuditAction; from?: string; to?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.actorId) where.actorId = params.actorId;
    if (params?.action) where.action = params.action;
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params?.from) where.createdAt.gte = new Date(params.from);
      if (params?.to) where.createdAt.lte = new Date(params.to);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, phone: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
