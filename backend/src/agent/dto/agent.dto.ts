import { IsString, Matches, IsNumber, IsOptional, Min, IsDateString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class DepositDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Numéro de téléphone invalide' })
  clientPhone: string;

  @IsNumber()
  @Min(100, { message: 'Le montant minimum est 100 FCFA' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class WithdrawalDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Numéro de téléphone invalide' })
  clientPhone: string;

  @IsNumber()
  @Min(100, { message: 'Le montant minimum est 100 FCFA' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ReportSuspectDto {
  @IsString()
  transactionId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class HistoryQueryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class StatsQueryDto {
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';
}
