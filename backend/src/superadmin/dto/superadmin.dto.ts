import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, Min } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  pin: string;

  @IsOptional()
  @IsString()
  role?: 'ADMIN' | 'SUPER_ADMIN';
}

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: 'ADMIN' | 'SUPER_ADMIN';

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'SUSPENDED';
}

export class CreateApiConfigDto {
  @IsString()
  name: string;

  @IsOptional()
  permissions?: string[];
}

export class UpdateGlobalSettingsDto {
  @IsOptional()
  fees?: Record<string, any>;
  @IsOptional()
  limits?: Record<string, any>;
  @IsOptional()
  general?: Record<string, any>;
  @IsOptional()
  security?: Record<string, any>;
  @IsOptional()
  notifications?: Record<string, any>;
}
