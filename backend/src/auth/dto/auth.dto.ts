import { IsString, Matches, Length, IsOptional, IsDateString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format (e.g. +2250701020304)',
  })
  phone: string;

  @IsString()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'PIN must contain only digits' })
  pin: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  code: string;
}

export class ResendOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;
}

export class SetPinDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'PIN must contain only digits' })
  pin: string;
}

export class ChangePinDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(4, 4, { message: 'Current PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'Current PIN must contain only digits' })
  currentPin: string;

  @IsString()
  @Length(4, 4, { message: 'New PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'New PIN must contain only digits' })
  newPin: string;
}

export class VerifyPinDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'PIN must contain only digits' })
  pin: string;
}

export class ValidateAccountDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(4, 4, { message: 'Le code doit contenir exactement 4 chiffres' })
  @Matches(/^\d{4}$/, { message: 'Le code ne doit contenir que des chiffres' })
  code: string;
}

export class CompleteProfileDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone must be in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @IsDateString({}, { message: 'Date of birth must be a valid date (YYYY-MM-DD)' })
  dateOfBirth: string;
}
