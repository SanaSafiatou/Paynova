import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  DepositDto,
  WithdrawalDto,
  ReportSuspectDto,
  HistoryQueryDto,
  StatsQueryDto,
} from './dto/agent.dto';

@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AGENT)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('identify/:phone')
  identifyClient(@Param('phone') phone: string) {
    return this.agentService.identifyClient(phone);
  }

  @Post('deposit')
  deposit(@Request() req: any, @Body() dto: DepositDto) {
    return this.agentService.deposit(req.user.id, dto.clientPhone, dto.amount, dto.description);
  }

  @Post('withdrawal')
  withdrawal(@Request() req: any, @Body() dto: WithdrawalDto) {
    return this.agentService.withdrawal(req.user.id, dto.clientPhone, dto.amount, dto.description);
  }

  @Get('history')
  history(@Request() req: any, @Query() query: HistoryQueryDto) {
    return this.agentService.history(req.user.id, query);
  }

  @Get('commissions')
  commissions(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.agentService.commissions(req.user.id, from, to);
  }

  @Get('stats')
  stats(@Request() req: any, @Query() query: StatsQueryDto) {
    return this.agentService.stats(req.user.id, query.period);
  }

  @Post('report-suspect')
  reportSuspect(@Request() req: any, @Body() dto: ReportSuspectDto) {
    return this.agentService.reportSuspect(req.user.id, dto.transactionId, dto.reason, dto.description);
  }
}
