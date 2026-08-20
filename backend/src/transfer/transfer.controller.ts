import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transfer')
@UseGuards(JwtAuthGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Request() req: any, @Body() dto: CreateTransferDto) {
    return this.transferService.transfer(req.user.id, dto);
  }
}
