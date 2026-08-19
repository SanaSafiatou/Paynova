import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || !apiKey.startsWith('pn_')) {
      throw new UnauthorizedException('Clé API invalide');
    }

    const prefix = apiKey.substring(0, 12);

    const config = await this.prisma.apiConfig.findFirst({
      where: { keyPrefix: prefix, isActive: true },
    });

    if (!config) throw new UnauthorizedException('Clé API introuvable');

    if (config.expiresAt && config.expiresAt < new Date()) {
      throw new UnauthorizedException('Clé API expirée');
    }

    const valid = await bcrypt.compare(apiKey, config.keyHash);
    if (!valid) throw new UnauthorizedException('Clé API invalide');

    await this.prisma.apiConfig.update({
      where: { id: config.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: `api-${config.id}`,
      role: 'API',
      permissions: config.permissions,
      isApiKey: true,
      configId: config.id,
    };
  }
}
