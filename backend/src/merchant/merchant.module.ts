import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CommissionModule } from '../commission/commission.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, AuditModule, CommissionModule, NotificationModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
