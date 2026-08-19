import { Injectable, Logger } from '@nestjs/common';
import { BillProvider, BillResult } from './provider.interface';

@Injectable()
export class MockBillProvider implements BillProvider {
  private readonly logger = new Logger('MockBillProvider');

  async payBill(billerCode: string, accountNumber: string, amount: number): Promise<BillResult> {
    this.logger.log(`[SIMULATED BILL] ${amount} FCFA to biller ${billerCode} (account: ${accountNumber})`);
    return { success: true, transactionId: `BILL-${Date.now()}` };
  }
}
