import { Controller, Post, Put, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  VerifyOtpDto,
  ResendOtpDto,
  SetPinDto,
  ChangePinDto,
  VerifyPinDto,
  CompleteProfileDto,
  ValidateAccountDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: VerifyPinDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return {
      id: req.user.id,
      phone: req.user.phone,
      role: req.user.role,
    };
  }

  @Post('validate-account')
  @HttpCode(HttpStatus.OK)
  validateAccount(@Body() dto: ValidateAccountDto) {
    return this.authService.validateAccount(dto);
  }

  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  completeProfile(@Body() dto: CompleteProfileDto) {
    return this.authService.completeProfile(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('set-pin')
  @HttpCode(HttpStatus.OK)
  setPin(@Body() dto: SetPinDto) {
    return this.authService.setPin(dto);
  }

  @Put('change-pin')
  @HttpCode(HttpStatus.OK)
  changePin(@Body() dto: ChangePinDto) {
    return this.authService.changePin(dto);
  }
}
