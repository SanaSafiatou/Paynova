import { Injectable, Logger } from '@nestjs/common';
import { NotificationProvider, NotificationResult } from './provider.interface';

@Injectable()
export class MockNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger('MockNotificationProvider');

  async sendPush(token: string, title: string, body: string, data?: Record<string, any>): Promise<NotificationResult> {
    this.logger.log(`[SIMULATED PUSH] To ${token.substring(0, 20)}... — ${title}: ${body}`);
    return { success: true, messageId: `mock-push-${Date.now()}` };
  }
}
