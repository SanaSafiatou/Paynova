import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString()
  userId: string;

  @IsString()
  status: 'ACTIVE' | 'SUSPENDED';
}

export class FlagTransactionDto {
  @IsString()
  transactionId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ValidateAgentDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAgentProfileDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsBoolean()
  trainingComplete?: boolean;

  @IsOptional()
  notes?: string;
}

export class ValidateMerchantDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMerchantDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewReportDto {
  @IsString()
  reportId: string;

  @IsString()
  status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
