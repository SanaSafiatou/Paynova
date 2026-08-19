import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentRequest, PaymentResult, PaymentStatusResult } from './provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger('MockPaymentProvider');
  private transactions = new Map<string, { data: PaymentRequest; status: string; createdAt: Date }>();

  async initiatePayment(data: PaymentRequest): Promise<PaymentResult> {
    const txId = `MPAY-${Date.now()}`;
    this.logger.log(`[SIMULATED PAYMENT] ${data.amount} ${data.currency} from ${data.phone} — ref: ${data.reference}`);
    this.transactions.set(txId, { data, status: 'PENDING', createdAt: new Date() });

    setTimeout(() => {
      const tx = this.transactions.get(txId);
      if (tx) tx.status = 'SUCCESS';
    }, 2000);

    return { success: true, transactionId: txId, externalRef: data.reference, status: 'PENDING' };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) return { status: 'FAILED' };
    return { status: tx.status as any, paidAt: tx.status === 'SUCCESS' ? tx.createdAt : undefined };
  }

  async cancelPayment(transactionId: string): Promise<PaymentResult> {
    const tx = this.transactions.get(transactionId);
    if (tx) tx.status = 'CANCELLED';
    return { success: true, transactionId, status: 'CANCELLED' };
  }
}
