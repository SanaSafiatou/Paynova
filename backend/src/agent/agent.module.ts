import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { CommissionModule } from '../commission/commission.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CommissionModule, NotificationModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
