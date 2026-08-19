import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SuperAdminService } from './superadmin.service';
import { CreateAdminDto, UpdateAdminDto, CreateApiConfigDto } from './dto/superadmin.dto';

@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private saService: SuperAdminService) {}

  // Dashboard
  @Get('dashboard')
  getDashboard() {
    return this.saService.getDashboard();
  }

  // Admin Management
  @Get('admins')
  getAdmins(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.saService.getAdmins({ q, role, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('admins/:id')
  getAdminDetail(@Param('id') id: string) {
    return this.saService.getAdminDetail(id);
  }

  @Post('admins')
  createAdmin(@Body() body: CreateAdminDto, @Req() req: any) {
    return this.saService.createAdmin(body, req.user.id, req.ip);
  }

  @Put('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() body: UpdateAdminDto, @Req() req: any) {
    return this.saService.updateAdmin(id, body, req.user.id, req.ip);
  }

  @Put('admins/:id/suspend')
  suspendAdmin(@Param('id') id: string, @Req() req: any) {
    return this.saService.suspendAdmin(id, req.user.id, req.ip);
  }

  @Put('admins/:id/reactivate')
  reactivateAdmin(@Param('id') id: string, @Req() req: any) {
    return this.saService.reactivateAdmin(id, req.user.id, req.ip);
  }

  // API Configuration
  @Get('api')
  getApiConfigs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.saService.getApiConfigs({ page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Post('api')
  createApiConfig(@Body() body: CreateApiConfigDto, @Req() req: any) {
    return this.saService.createApiConfig(body, req.user.id, req.ip);
  }

  @Put('api/:id/revoke')
  revokeApiConfig(@Param('id') id: string, @Req() req: any) {
    return this.saService.revokeApiConfig(id, req.user.id, req.ip);
  }

  // Documents
  @Get('documents')
  getDocuments(@Query('userId') userId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.saService.getDocuments({ userId, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string, @Req() req: any) {
    return this.saService.deleteDocument(id, req.user.id, req.ip);
  }

  // Statistics
  @Get('stats')
  getGlobalStats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.saService.getGlobalStats({ from, to });
  }

  // Security
  @Get('security/events')
  getSecurityEvents(
    @Query('severity') severity?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.saService.getSecurityEvents({ severity, userId, from, to, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('security/sessions')
  getActiveSessions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.saService.getActiveSessions({ page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Put('security/sessions/:id/revoke')
  revokeSession(@Param('id') id: string, @Req() req: any) {
    return this.saService.revokeSession(id, req.user.id, req.ip);
  }

  @Get('security/devices/:userId')
  getUserDevices(@Param('userId') userId: string) {
    return this.saService.getUserDevices(userId);
  }

  // Global data (reusing admin endpoints logic)
  @Get('users')
  getUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.saService.getGlobalUsers({ q, role, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

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
    return this.saService.getGlobalTransactions({ q, type, status, from, to, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('agents')
  getAgents(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.saService.getGlobalAgents({ q, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('merchants')
  getMerchants(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.saService.getGlobalMerchants({ q, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
}
