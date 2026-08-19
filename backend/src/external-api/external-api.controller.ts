import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProviderRegistry } from './providers/provider.registry';

@Controller('external-api')
export class ExternalApiController {
  constructor(private registry: ProviderRegistry) {}

  @Get('status')
  getStatus() {
    return {
      environment: process.env.NODE_ENV || 'development',
      providers: {
        sms: 'MOCK',
        payment: 'MOCK',
        ocr: 'MOCK',
        identity: 'MOCK',
        notification: 'MOCK',
        credit: 'MOCK',
        bill: 'MOCK',
      },
      note: 'Tous les providers sont en mode simulation. Configurez les clés API dans .env pour activer les providers réels.',
    };
  }

  @Post('test/sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async testSms(@Body() body: { phone: string; message?: string }) {
    return this.registry.getSms().sendSms(body.phone, body.message || 'Test PayNova');
  }

  @Post('test/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async testPayment(@Body() body: { amount: number; phone: string; reference?: string }) {
    return this.registry.getPayment().initiatePayment({
      amount: body.amount,
      currency: 'XOF',
      phone: body.phone,
      description: 'Test paiement',
      reference: body.reference || `TEST-${Date.now()}`,
    });
  }

  @Post('test/ocr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async testOcr(@Body() body: { imageBase64: string }) {
    return this.registry.getOcr().extractText(body.imageBase64);
  }

  @Post('test/identity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async testIdentity(@Body() body: { fullName: string; documentNumber: string; documentType: string }) {
    return this.registry.getIdentity().verify({
      ...body,
      imageBase64: 'test-image',
    });
  }
}
