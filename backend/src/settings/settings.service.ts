import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

const DEFAULT_SETTINGS: Record<string, any> = {
  'fees.deposit': { label: 'Frais de dépôt', type: 'number', unit: '%', value: 1.5, min: 0, max: 10 },
  'fees.withdrawal': { label: 'Frais de retrait', type: 'number', unit: '%', value: 2, min: 0, max: 10 },
  'fees.transfer': { label: 'Frais de transfert', type: 'number', unit: '%', value: 1, min: 0, max: 10 },
  'fees.payment': { label: 'Frais de paiement', type: 'number', unit: '%', value: 1.5, min: 0, max: 10 },
  'fees.minAmount': { label: 'Montant minimum frais', type: 'number', unit: 'F CFA', value: 500, min: 0 },
  'commissions.agent': { label: 'Commission agent (%)', type: 'number', unit: '%', value: 5, min: 0, max: 50 },
  'commissions.merchant': { label: 'Commission commerçant (%)', type: 'number', unit: '%', value: 2, min: 0, max: 20 },
  'commissions.referral': { label: 'Commission parrainage (%)', type: 'number', unit: '%', value: 1, min: 0, max: 10 },
  'limits.dailyWithdrawal': { label: 'Plafond retrait journalier', type: 'number', unit: 'F CFA', value: 500000, min: 0 },
  'limits.dailyDeposit': { label: 'Plafond dépôt journalier', type: 'number', unit: 'F CFA', value: 1000000, min: 0 },
  'limits.dailyTransfer': { label: 'Plafond transfert journalier', type: 'number', unit: 'F CFA', value: 500000, min: 0 },
  'limits.minWithdrawal': { label: 'Montant minimum retrait', type: 'number', unit: 'F CFA', value: 1000, min: 0 },
  'limits.minDeposit': { label: 'Montant minimum dépôt', type: 'number', unit: 'F CFA', value: 500, min: 0 },
  'limits.minTransfer': { label: 'Montant minimum transfert', type: 'number', unit: 'F CFA', value: 500, min: 0 },
  'general.whatsappNumber': { label: 'Numéro WhatsApp support', type: 'text', value: '' },
  'general.currency': { label: 'Devise', type: 'text', value: 'F CFA' },
  'security.maxPinAttempts': { label: 'Tentatives PIN max', type: 'number', unit: 'tentatives', value: 5, min: 1, max: 10 },
  'security.pinLockoutDuration': { label: 'Durée blocage PIN', type: 'number', unit: 'secondes', value: 300, min: 60 },
  'security.otpExpiry': { label: 'Durée validité OTP', type: 'number', unit: 'minutes', value: 5, min: 1 },
  'notifications.enabled': { label: 'Notifications activées', type: 'boolean', value: true },
  'notifications.depositAlerts': { label: 'Alertes dépôts', type: 'boolean', value: true },
  'notifications.withdrawalAlerts': { label: 'Alertes retraits', type: 'boolean', value: true },
  'notifications.dailyReport': { label: 'Rapport journalier', type: 'boolean', value: false },
};

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getAll() {
    const settings = await this.prisma.appSetting.findMany();
    const storedMap: Record<string, any> = {};
    for (const s of settings) {
      storedMap[s.key] = s.value;
    }

    const result: Record<string, any> = {};
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      const stored = storedMap[key];
      result[key] = {
        ...config,
        value: stored !== undefined ? stored : config.value,
      };
    }
    return result;
  }

  async getGroup(group: string) {
    const all = await this.getAll();
    const filtered: Record<string, any> = {};
    for (const [key, config] of Object.entries(all)) {
      if (key.startsWith(group + '.')) {
        filtered[key] = config;
      }
    }
    return filtered;
  }

  async update(updates: Record<string, any>, actorId: string, ip?: string) {
    const entries = Object.entries(updates);
    for (const [key, value] of entries) {
      const config = DEFAULT_SETTINGS[key];
      if (!config) continue;

      if (config.type === 'number' && typeof value === 'number') {
        if (config.min !== undefined && value < config.min) continue;
        if (config.max !== undefined && value > config.max) continue;
      }

      await this.prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await this.audit.log({
      actorId, action: AuditAction.SETTINGS_UPDATE,
      targetType: 'SETTINGS',
      details: { keys: entries.map(([k]) => k) }, ip,
    });

    return { message: 'Paramètres mis à jour', updated: entries.map(([k]) => k) };
  }
}
