import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionModule } from '../commission/commission.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, CommissionModule, NotificationModule],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
