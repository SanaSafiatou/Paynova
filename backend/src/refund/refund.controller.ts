import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RefundService } from './refund.service';

@Controller('admin/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class RefundController {
  constructor(private refundService: RefundService) {}

  @Get('search-transaction')
  searchTransaction(@Query('q') q: string) {
    return this.refundService.searchTransaction(q);
  }

  @Get('stats')
  getStats() {
    return this.refundService.getRefundStats();
  }

  @Get()
  listRefunds(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.refundService.listRefunds({
      status, q,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':id')
  getRefundDetail(@Param('id') id: string) {
    return this.refundService.getRefundDetail(id);
  }

  @Post()
  createRefund(
    @Body() body: {
      transactionId: string;
      refundAmount: number;
      reason: string;
      debitUserId: string;
      creditUserId: string;
      note?: string;
    },
    @Req() req: any,
  ) {
    return this.refundService.requestRefund({
      ...body,
      adminId: req.user.id,
      ip: req.ip,
    });
  }

  @Put(':id/approve')
  approveRefund(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    return this.refundService.approveRefund(id, req.user.id, body.note, req.ip);
  }

  @Put(':id/refuse')
  refuseRefund(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    return this.refundService.refuseRefund(id, req.user.id, body.note, req.ip);
  }

  @Put(':id/execute')
  executeRefund(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.refundService.executeRefund(id, req.user.id, req.ip);
  }
}
