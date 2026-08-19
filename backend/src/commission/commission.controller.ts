import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TransactionType } from '@prisma/client';

class CreateCommissionRuleDto {
  type: TransactionType;
  minAmount: number;
  maxAmount: number;
  rate: number;
  fixedAmount?: number;
}

class UpdateCommissionRuleDto {
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  rate?: number;
  fixedAmount?: number;
  isActive?: boolean;
}

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('rules')
  findAll() {
    return this.commissionService.findAll();
  }

  @Get('rules/:id')
  findOne(@Param('id') id: string) {
    return this.commissionService.findById(id);
  }

  @Post('rules')
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionService.create(dto);
  }

  @Put('rules/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.commissionService.update(id, dto);
  }

  @Delete('rules/:id')
  remove(@Param('id') id: string) {
    return this.commissionService.remove(id);
  }
}
