import { Controller, Get, Put, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MerchantService } from './merchant.service';
import { UpdateProfileDto, RequestWithdrawalDto, ReceivePaymentDto } from './dto/merchant.dto';

@Controller('merchant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('profile')
  @Roles('COMMERCANT')
  getProfile(@Req() req: any) {
    return this.merchantService.getProfile(req.user.id);
  }

  @Put('profile')
  @Roles('COMMERCANT')
  updateProfile(@Body() body: UpdateProfileDto, @Req() req: any) {
    return this.merchantService.updateProfile(req.user.id, body);
  }

  @Get('qr')
  @Roles('COMMERCANT')
  getQrCode(@Req() req: any) {
    return this.merchantService.getQrCode(req.user.id);
  }

  @Get('sales')
  @Roles('COMMERCANT')
  getSales(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantService.getSales(req.user.id, {
      from, to, page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  @Get('history')
  @Roles('COMMERCANT')
  getHistory(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantService.getHistory(req.user.id, {
      type, page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  @Get('stats')
  @Roles('COMMERCANT')
  getStats(@Req() req: any, @Query('period') period?: string) {
    return this.merchantService.getStats(req.user.id, { period });
  }

  @Get('balance')
  @Roles('COMMERCANT')
  getBalance(@Req() req: any) {
    return this.merchantService.getBalance(req.user.id);
  }

  @Post('withdrawal')
  @Roles('COMMERCANT')
  requestWithdrawal(@Body() body: RequestWithdrawalDto, @Req() req: any) {
    return this.merchantService.requestWithdrawal(req.user.id, body.amount, body.note);
  }

  @Get('withdrawals')
  @Roles('COMMERCANT')
  getWithdrawals(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantService.getWithdrawals(req.user.id, {
      status, page: page ? +page : undefined, limit: limit ? +limit : undefined,
    });
  }

  @Post('pay')
  @Roles('AGENT')
  receivePayment(@Body() body: ReceivePaymentDto) {
    return this.merchantService.receivePayment(body);
  }
}
