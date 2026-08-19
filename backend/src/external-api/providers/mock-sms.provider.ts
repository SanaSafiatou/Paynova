import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsResult } from './provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger('MockSmsProvider');

  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    this.logger.log(`[SIMULATED SMS] OTP to ${phone}: ${code}`);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    this.logger.log(`[SIMULATED SMS] To ${phone}: ${message}`);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}
