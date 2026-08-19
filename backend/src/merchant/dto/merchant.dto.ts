import { IsString, IsOptional, IsNumber, Min, MinLength, IsEnum } from 'class-validator';
import { WithdrawalStatus } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}

export class RequestWithdrawalDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ProcessWithdrawalDto {
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ReceivePaymentDto {
  @IsString()
  @MinLength(1)
  merchantCode: string;

  @IsString()
  @MinLength(1)
  clientPhone: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  agentId?: string;
}
