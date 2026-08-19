export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<SmsResult>;
  sendSms(phone: string, message: string): Promise<SmsResult>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PaymentProvider {
  initiatePayment(data: PaymentRequest): Promise<PaymentResult>;
  checkStatus(transactionId: string): Promise<PaymentStatusResult>;
  cancelPayment(transactionId: string): Promise<PaymentResult>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  phone: string;
  description: string;
  reference: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  externalRef?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  error?: string;
}

export interface PaymentStatusResult {
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  paidAt?: Date;
}

export interface OcrProvider {
  extractText(imageBase64: string): Promise<OcrResult>;
}

export interface OcrResult {
  success: boolean;
  texts?: { text: string; confidence: number }[];
  error?: string;
}

export interface IdentityProvider {
  verify(data: IdentityRequest): Promise<IdentityResult>;
}

export interface IdentityRequest {
  fullName: string;
  documentNumber: string;
  documentType: string;
  imageBase64: string;
}

export interface IdentityResult {
  success: boolean;
  verified: boolean;
  details?: Record<string, any>;
  error?: string;
}

export interface NotificationProvider {
  sendPush(token: string, title: string, body: string, data?: Record<string, any>): Promise<NotificationResult>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CreditProvider {
  buyCredit(phone: string, amount: number): Promise<CreditResult>;
}

export interface CreditResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface BillProvider {
  payBill(billerCode: string, accountNumber: string, amount: number): Promise<BillResult>;
}

export interface BillResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}
