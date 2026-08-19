import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisService } from './redis.service';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyStrategy } from './api-key.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
      signOptions: { expiresIn: 900 },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, JwtStrategy, ApiKeyStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
