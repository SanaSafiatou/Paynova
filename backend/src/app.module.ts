import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AgentModule } from './agent/agent.module';
import { CommissionModule } from './commission/commission.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { SuperAdminModule } from './superadmin/superadmin.module';
import { MerchantModule } from './merchant/merchant.module';
import { RefundModule } from './refund/refund.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { AutomationModule } from './automation/automation.module';
import { TransferModule } from './transfer/transfer.module';
import { AccessLogInterceptor } from './auth/access-log.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 },
    ]),
    PrismaModule,
    AuthModule,
    AgentModule,
    CommissionModule,
    NotificationModule,
    AdminModule,
    SettingsModule,
    SuperAdminModule,
    MerchantModule,
    RefundModule,
    ExternalApiModule,
    AutomationModule,
    TransferModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AccessLogInterceptor },
  ],
})
export class AppModule {}
