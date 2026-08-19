import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ==================== DASHBOARD ====================
  async getDashboard() {
    const [
      totalUsers, totalAgents, totalMerchants, totalAdmins, totalTransactions,
      activeAdmins, pendingReports, totalSessions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'AGENT' } }),
      this.prisma.user.count({ where: { role: 'COMMERCANT' } }),
      this.prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      this.prisma.transaction.count(),
      this.prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' } }),
      this.prisma.suspiciousReport.count({ where: { status: 'PENDING' } }),
      this.prisma.adminSession.count({ where: { revokedAt: null } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTx, recentAudit, apiConfigs, securityEvents] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { createdAt: { gte: today } },
        select: { amount: true, type: true, status: true, fees: true, commission: true },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { id: true, phone: true, name: true } } },
      }),
      this.prisma.apiConfig.count({ where: { isActive: true } }),
      this.prisma.securityEvent.count({
        where: { createdAt: { gte: today }, severity: { in: ['WARNING', 'CRITICAL'] } },
      }),
    ]);

    const todayStats = {
      count: todayTx.length,
      totalAmount: todayTx.reduce((s, t) => s + Number(t.amount), 0),
      totalFees: todayTx.reduce((s, t) => s + Number(t.fees), 0),
      totalCommissions: todayTx.reduce((s, t) => s + Number(t.commission), 0),
      deposits: todayTx.filter(t => t.type === 'DEPOSIT').length,
      withdrawals: todayTx.filter(t => t.type === 'WITHDRAWAL').length,
      transfers: todayTx.filter(t => t.type === 'TRANSFER').length,
      payments: todayTx.filter(t => t.type === 'PAYMENT').length,
    };

    return {
      totalUsers, totalAgents, totalMerchants, totalAdmins,
      totalTransactions, activeAdmins, pendingReports, totalSessions,
      activeApiConfigs: apiConfigs, securityEventsToday: securityEvents,
      todayStats, recentAudit,
    };
  }

  // ==================== ADMIN MANAGEMENT ====================
  async getAdmins(params?: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } };
    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;
    if (params?.q) {
      where.OR = [
        { phone: { contains: params.q, mode: 'insensitive' } },
        { name: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, name: true, role: true, status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { admins, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getAdminDetail(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      include: {
        devices: true,
        sessions: { where: { revokedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { auditActions: true } },
      },
    });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new NotFoundException('Administrateur non trouvé');
    }
    return admin;
  }

  async createAdmin(data: { phone: string; name?: string; pin: string; role?: string }, actorId: string, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new ConflictException('Ce numéro est déjà utilisé');

    const pinHash = await bcrypt.hash(data.pin, 10);
    const admin = await this.prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        pinHash,
        role: (data.role as any) || 'ADMIN',
        phoneVerified: true,
        accountValidated: true,
      },
    });

    await this.audit.log({
      actorId, action: AuditAction.ADMIN_CREATE,
      targetId: admin.id, targetType: 'USER',
      details: { phone: admin.phone, role: admin.role, name: admin.name }, ip,
    });

    return { id: admin.id, phone: admin.phone, name: admin.name, role: admin.role };
  }

  async updateAdmin(id: string, data: { name?: string; phone?: string; role?: string; status?: string }, actorId: string, ip?: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    if (data.phone && data.phone !== admin.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException('Ce numéro est déjà utilisé');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.status !== undefined && { status: data.status as any }),
      },
    });

    await this.audit.log({
      actorId, action: AuditAction.ADMIN_UPDATE,
      targetId: id, targetType: 'USER',
      details: { changes: data }, ip,
    });

    return updated;
  }

  async suspendAdmin(id: string, actorId: string, ip?: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new NotFoundException('Administrateur non trouvé');
    }
    if (admin.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Impossible de suspendre un Super Administrateur');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await this.audit.log({
      actorId, action: AuditAction.ADMIN_SUSPEND,
      targetId: id, targetType: 'USER',
      details: { phone: admin.phone, name: admin.name }, ip,
    });

    return updated;
  }

  async reactivateAdmin(id: string, actorId: string, ip?: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.audit.log({
      actorId, action: AuditAction.ADMIN_REACTIVATE,
      targetId: id, targetType: 'USER',
      details: { phone: admin.phone, name: admin.name }, ip,
    });

    return updated;
  }

  // ==================== API CONFIGURATION ====================
  async getApiConfigs(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [configs, total] = await Promise.all([
      this.prisma.apiConfig.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.apiConfig.count(),
    ]);

    return { configs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createApiConfig(data: { name: string; permissions?: string[] }, actorId: string, ip?: string) {
    const rawKey = `pn_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 12);

    const config = await this.prisma.apiConfig.create({
      data: {
        name: data.name,
        keyHash,
        keyPrefix,
        permissions: data.permissions || [],
        createdBy: actorId,
      },
    });

    await this.audit.log({
      actorId, action: AuditAction.API_KEY_CREATE,
      targetId: config.id, targetType: 'API_CONFIG',
      details: { name: data.name }, ip,
    });

    return { id: config.id, name: config.name, keyPrefix: config.keyPrefix, key: rawKey, permissions: config.permissions };
  }

  async revokeApiConfig(id: string, actorId: string, ip?: string) {
    const config = await this.prisma.apiConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Configuration API non trouvée');

    const updated = await this.prisma.apiConfig.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });

    await this.audit.log({
      actorId, action: AuditAction.API_KEY_REVOKE,
      targetId: id, targetType: 'API_CONFIG',
      details: { name: config.name }, ip,
    });

    return updated;
  }

  // ==================== DOCUMENTS ====================
  async getDocuments(params?: { userId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.userId) where.userId = params.userId;

    const [docs, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: { user: { select: { id: true, phone: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents: docs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async deleteDocument(id: string, actorId: string, ip?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document non trouvé');

    await this.prisma.document.delete({ where: { id } });

    await this.audit.log({
      actorId, action: AuditAction.DOCUMENT_DELETE,
      targetId: id, targetType: 'DOCUMENT',
      details: { fileName: doc.fileName, userId: doc.userId }, ip,
    });

    return { deleted: true };
  }

  // ==================== GLOBAL STATISTICS ====================
  async getGlobalStats(params?: { from?: string; to?: string }) {
    const from = params?.from ? new Date(params.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = params?.to ? new Date(params.to) : new Date();

    const [txStats, userStats, agentStats, merchantStats, dailyTx] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _count: true,
        _sum: { amount: true, fees: true, commission: true },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { gte: from, lte: to } },
        _count: true,
      }),
      this.prisma.user.count({ where: { role: 'AGENT', createdAt: { gte: from, lte: to } } }),
      this.prisma.user.count({ where: { role: 'COMMERCANT', createdAt: { gte: from, lte: to } } }),
      this.prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count,
               SUM(amount)::float as total
        FROM "Transaction"
        WHERE created_at >= ${from} AND created_at <= ${to}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    const suspensions = await this.prisma.user.count({
      where: { status: 'SUSPENDED', updatedAt: { gte: from, lte: to } },
    });

    return {
      period: { from, to },
      transactions: {
        count: txStats._count,
        totalAmount: Number(txStats._sum.amount || 0),
        totalFees: Number(txStats._sum.fees || 0),
        totalCommissions: Number(txStats._sum.commission || 0),
      },
      users: userStats.map(u => ({ role: u.role, count: u._count })),
      newAgents: agentStats,
      newMerchants: merchantStats,
      suspensions,
      dailyTransactions: dailyTx,
    };
  }

  // ==================== SECURITY ====================
  async getSecurityEvents(params?: { severity?: string; userId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.severity) where.severity = params.severity;
    if (params?.userId) where.userId = params.userId;
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params?.from) where.createdAt.gte = new Date(params.from);
      if (params?.to) where.createdAt.lte = new Date(params.to);
    }

    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getActiveSessions(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.adminSession.findMany({
        where: { revokedAt: null },
        include: { user: { select: { id: true, phone: true, name: true, role: true } } },
        orderBy: { lastActiveAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.adminSession.count({ where: { revokedAt: null } }),
    ]);

    return { sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async revokeSession(id: string, actorId: string, ip?: string) {
    const session = await this.prisma.adminSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session non trouvée');

    const updated = await this.prisma.adminSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      actorId, action: AuditAction.SECURITY_SESSION_REVOKE,
      targetId: id, targetType: 'SESSION',
      details: { userId: session.userId }, ip,
    });

    return updated;
  }

  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  // ==================== REUSE EXISTING (from AdminService) ====================
  // These delegate to existing endpoints — the superadmin mobile screens
  // can call the same /admin/* endpoints since SUPER_ADMIN passes @Roles('ADMIN', 'SUPER_ADMIN')

  async getGlobalUsers(params: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
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

  async getGlobalTransactions(params: { q?: string; type?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) {
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

  async getGlobalAgents(params?: { q?: string; status?: string; page?: number; limit?: number }) {
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

  async getGlobalMerchants(params?: { q?: string; status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: 'COMMERCANT' };
    if (params?.status) where.status = params.status;
    if (params?.q) {
      where.OR = [
        { phone: { contains: params.q, mode: 'insensitive' } },
        { name: { contains: params.q, mode: 'insensitive' } },
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
}
