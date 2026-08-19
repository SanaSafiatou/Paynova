import { Injectable, Logger } from '@nestjs/common';
import { CreditProvider, CreditResult } from './provider.interface';

@Injectable()
export class MockCreditProvider implements CreditProvider {
  private readonly logger = new Logger('MockCreditProvider');

  async buyCredit(phone: string, amount: number): Promise<CreditResult> {
    this.logger.log(`[SIMULATED CREDIT] ${amount} FCFA credit to ${phone}`);
    return { success: true, transactionId: `CR-${Date.now()}` };
  }
}
