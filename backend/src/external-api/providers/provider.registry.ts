import { Injectable } from '@nestjs/common';
import {
  SmsProvider, PaymentProvider, OcrProvider, IdentityProvider,
  NotificationProvider, CreditProvider, BillProvider,
} from './provider.interface';
import { MockSmsProvider } from './mock-sms.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { MockOcrProvider } from './mock-ocr.provider';
import { MockIdentityProvider } from './mock-identity.provider';
import { MockNotificationProvider } from './mock-notification.provider';
import { MockCreditProvider } from './mock-credit.provider';
import { MockBillProvider } from './mock-bill.provider';

@Injectable()
export class ProviderRegistry {
  private providers = new Map<string, any>();

  constructor() {
    this.providers.set('sms', new MockSmsProvider());
    this.providers.set('payment', new MockPaymentProvider());
    this.providers.set('ocr', new MockOcrProvider());
    this.providers.set('identity', new MockIdentityProvider());
    this.providers.set('notification', new MockNotificationProvider());
    this.providers.set('credit', new MockCreditProvider());
    this.providers.set('bill', new MockBillProvider());
  }

  getSms(): SmsProvider { return this.providers.get('sms'); }
  getPayment(): PaymentProvider { return this.providers.get('payment'); }
  getOcr(): OcrProvider { return this.providers.get('ocr'); }
  getIdentity(): IdentityProvider { return this.providers.get('identity'); }
  getNotification(): NotificationProvider { return this.providers.get('notification'); }
  getCredit(): CreditProvider { return this.providers.get('credit'); }
  getBill(): BillProvider { return this.providers.get('bill'); }

  register(name: string, provider: any) {
    this.providers.set(name, provider);
  }
}
