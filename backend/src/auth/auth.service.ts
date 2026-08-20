import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
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
import * as bcrypt from 'bcryptjs';

const PIN_SALT_ROUNDS = 10;
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_SECONDS = 300;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  private generateTokens(user: { id: string; phone: string; role: string }) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: 604800, // 7 days in seconds
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      return {
        exists: true,
        message: 'Un compte existe déjà avec ce numéro. Veuillez vous connecter.',
        phone: dto.phone,
      };
    }

    const pinHash = await bcrypt.hash(dto.pin, PIN_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        role: 'CLIENT',
        phoneVerified: false,
        pinHash,
      },
    });

    return {
      exists: false,
      message: 'Compte créé avec succès',
      userId: user.id,
      phone: user.phone,
      role: user.role,
      profileComplete: false,
    };
  }

  async login(dto: VerifyPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Aucun compte trouvé avec ce numéro');
    }

    if (!user.pinHash) {
      throw new BadRequestException('Aucun code PIN défini. Veuillez créer un compte.');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ForbiddenException(
        'Trop de tentatives échouées. Veuillez réessayer plus tard.',
      );
    }

    const valid = await bcrypt.compare(dto.pin, user.pinHash);

    if (!valid) {
      const newAttempts = user.pinAttempts + 1;

      const updateData: {
        pinAttempts: number;
        pinLockedUntil?: Date | null;
      } = { pinAttempts: newAttempts };

      if (newAttempts >= PIN_MAX_ATTEMPTS) {
        updateData.pinLockedUntil = new Date(
          Date.now() + PIN_LOCKOUT_SECONDS * 1000,
        );
        updateData.pinAttempts = 0;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new ForbiddenException('Code PIN incorrect');
    }

    if (user.pinAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { pinAttempts: 0, pinLockedUntil: null },
      });
    }

    const tokens = this.generateTokens(user);

    return {
      message: 'Connexion réussie',
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        profileComplete: user.profileComplete,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch {
      throw new ForbiddenException('Refresh token invalide ou expiré');
    }
  }

  async validateAccount(dto: ValidateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Aucun compte trouvé avec ce numéro');
    }

    if (user.accountValidated) {
      return {
        message: 'Compte déjà validé',
        userId: user.id,
        phone: user.phone,
        accountValidated: true,
      };
    }

    const VALIDATION_CODE = '1234';

    if (dto.code !== VALIDATION_CODE) {
      throw new ForbiddenException('Code de validation incorrect. Veuillez réessayer.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { accountValidated: true },
    });

    return {
      message: 'Compte validé avec succès',
      userId: updatedUser.id,
      phone: updatedUser.phone,
      accountValidated: true,
    };
  }

  async completeProfile(dto: CompleteProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Numéro de téléphone introuvable');
    }

    if (user.profileComplete) {
      return {
        message: 'Profil déjà complété',
        userId: user.id,
        phone: user.phone,
        name: user.name,
        profileComplete: true,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        dateOfBirth: new Date(dto.dateOfBirth),
        profileComplete: true,
      },
    });

    return {
      message: 'Profil complété avec succès',
      userId: updatedUser.id,
      phone: updatedUser.phone,
      name: updatedUser.name,
      profileComplete: true,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Numéro de téléphone introuvable');
    }

    if (user.phoneVerified) {
      return {
        message: 'Téléphone déjà vérifié',
        userId: user.id,
        phone: user.phone,
        role: user.role,
      };
    }

    const storedOtp = await this.redis.getOtp(dto.phone);

    if (!storedOtp) {
      throw new BadRequestException('Code OTP expiré ou non demandé');
    }

    if (storedOtp !== dto.code) {
      throw new BadRequestException('Code OTP invalide');
    }

    await this.redis.deleteOtp(dto.phone);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    return {
      message: 'Téléphone vérifié avec succès',
      userId: updatedUser.id,
      phone: updatedUser.phone,
      role: updatedUser.role,
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Numéro de téléphone introuvable');
    }

    if (user.phoneVerified) {
      throw new BadRequestException('Téléphone déjà vérifié');
    }

    const otp = this.generateOtp();
    await this.redis.setOtp(dto.phone, otp);

    console.log(`[OTP] Phone: ${dto.phone} | Code: ${otp}`);

    return { message: 'OTP renvoyé avec succès' };
  }

  async setPin(dto: SetPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Numéro de téléphone introuvable');
    }

    if (user.pinHash) {
      throw new BadRequestException('PIN déjà défini. Utilisez change-pin pour le modifier.');
    }

    const pinHash = await bcrypt.hash(dto.pin, PIN_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    });

    return {
      message: 'Code PIN défini avec succès',
      userId: user.id,
      phone: user.phone,
    };
  }

  async changePin(dto: ChangePinDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Numéro de téléphone introuvable');
    }

    if (!user.pinHash) {
      throw new BadRequestException('Aucun PIN défini. Utilisez set-pin d\'abord.');
    }

    const validCurrentPin = await bcrypt.compare(dto.currentPin, user.pinHash);

    if (!validCurrentPin) {
      throw new ForbiddenException('Code PIN actuel incorrect');
    }

    if (dto.currentPin === dto.newPin) {
      throw new BadRequestException('Le nouveau PIN doit être différent du PIN actuel');
    }

    const newPinHash = await bcrypt.hash(dto.newPin, PIN_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash: newPinHash,
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });

    return {
      message: 'Code PIN modifié avec succès',
      userId: user.id,
      phone: user.phone,
    };
  }

  async verifyPin(dto: VerifyPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('Aucun compte trouvé avec ce numéro');
    }

    if (!user.pinHash) {
      throw new BadRequestException('Aucun code PIN défini');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ForbiddenException(
        'Trop de tentatives échouées. Veuillez réessayer plus tard.',
      );
    }

    const valid = await bcrypt.compare(dto.pin, user.pinHash);

    if (!valid) {
      const newAttempts = user.pinAttempts + 1;
      const updateData: {
        pinAttempts: number;
        pinLockedUntil?: Date | null;
      } = { pinAttempts: newAttempts };

      if (newAttempts >= PIN_MAX_ATTEMPTS) {
        updateData.pinLockedUntil = new Date(
          Date.now() + PIN_LOCKOUT_SECONDS * 1000,
        );
        updateData.pinAttempts = 0;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new ForbiddenException('Code PIN incorrect');
    }

    if (user.pinAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { pinAttempts: 0, pinLockedUntil: null },
      });
    }

    return {
      message: 'PIN vérifié',
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
