import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
import { RegisterDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        role: 'CLIENT',
        phoneVerified: false,
      },
    });

    const otp = this.generateOtp();
    await this.redis.setOtp(dto.phone, otp);

    console.log(`[OTP] Phone: ${dto.phone} | Code: ${otp}`);

    return {
      message: 'OTP sent successfully',
      userId: user.id,
      phone: user.phone,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Phone number not found');
    }

    if (user.phoneVerified) {
      return { message: 'Phone already verified', userId: user.id };
    }

    const storedOtp = await this.redis.getOtp(dto.phone);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not requested');
    }

    if (storedOtp !== dto.code) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.redis.deleteOtp(dto.phone);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    return {
      message: 'Phone verified successfully',
      userId: updatedUser.id,
      phone: updatedUser.phone,
      role: updatedUser.role,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
