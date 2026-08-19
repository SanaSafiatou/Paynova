import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import {
  UpdateUserStatusDto, FlagTransactionDto, ValidateAgentDto,
  UpdateAgentProfileDto, ValidateMerchantDto, ReviewReportDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // Users
  @Get('users')
  getUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers({ q, role, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('users/:id/transactions')
  getUserTransactions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUserTransactions(id, {
      page: page ? +page : undefined, limit: limit ? +limit : undefined, type, status,
    });
  }

  @Put('users/:id/suspend')
  suspendUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.suspendUser(id, req.user.id, req.ip);
  }

  @Put('users/:id/reactivate')
  reactivateUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.reactivateUser(id, req.user.id, req.ip);
  }

  // Transactions
  @Get('transactions')
  getTransactions(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTransactions({
      q, type, status, from, to,
      page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  @Get('transactions/:id')
  getTransactionDetail(@Param('id') id: string) {
    return this.adminService.getTransactionDetail(id);
  }

  @Put('transactions/:id/flag')
  flagTransaction(
    @Param('id') id: string,
    @Body() body: { reason: string; description?: string },
    @Req() req: any,
  ) {
    return this.adminService.flagTransaction(id, body.reason, body.description, req.user.id, req.ip);
  }

  // Agents
  @Get('agents')
  getAgents(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('validated') validated?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAgents({ q, status, validated, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Post('agents/validate')
  validateAgent(@Body() body: ValidateAgentDto, @Req() req: any) {
    return this.adminService.validateAgent(body.userId, req.user.id, body.notes, req.ip);
  }

  @Put('agents/:id/suspend')
  suspendAgent(@Param('id') id: string, @Req() req: any) {
    return this.adminService.suspendAgent(id, req.user.id, req.ip);
  }

  @Put('agents/:id/reactivate')
  reactivateAgent(@Param('id') id: string, @Req() req: any) {
    return this.adminService.reactivateAgent(id, req.user.id, req.ip);
  }

  @Put('agents/:id/profile')
  updateAgentProfile(
    @Param('id') id: string,
    @Body() body: { trainingComplete?: boolean; notes?: string },
    @Req() req: any,
  ) {
    return this.adminService.updateAgentProfile(id, body, req.user.id, req.ip);
  }

  @Get('agents/:id/commissions')
  getAgentCommissions(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAgentCommissions(id, {
      from, to, page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  // Merchants
  @Get('merchants')
  getMerchants(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getMerchants({ q, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Post('merchants/validate')
  validateMerchant(@Body() body: ValidateMerchantDto, @Req() req: any) {
    return this.adminService.validateMerchant(body.userId, req.user.id, {
      businessName: body.businessName, businessType: body.businessType, notes: body.notes,
    }, req.ip);
  }

  @Put('merchants/:id/suspend')
  suspendMerchant(@Param('id') id: string, @Req() req: any) {
    return this.adminService.suspendMerchant(id, req.user.id, req.ip);
  }

  @Put('merchants/:id/reactivate')
  reactivateMerchant(@Param('id') id: string, @Req() req: any) {
    return this.adminService.reactivateMerchant(id, req.user.id, req.ip);
  }

  @Get('merchants/:id/payments')
  getMerchantPayments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getMerchantPayments(id, {
      page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  // Withdrawals
  @Get('withdrawals')
  getPendingWithdrawals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPendingWithdrawals({
      page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  @Put('withdrawals/:id')
  processWithdrawal(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
    @Req() req: any,
  ) {
    return this.adminService.processWithdrawal(id, body.status, req.user.id, body.note, req.ip);
  }

  // Reports
  @Get('reports')
  getReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReports({ status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Put('reports/:id/review')
  reviewReport(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    return this.adminService.reviewReport(id, body.status, req.user.id, req.ip);
  }

  // Audit
  @Get('audit')
  getAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      actorId, action, from, to,
      page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }
}
