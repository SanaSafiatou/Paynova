import { Injectable, Logger } from '@nestjs/common';
import { IdentityProvider, IdentityRequest, IdentityResult } from './provider.interface';

@Injectable()
export class MockIdentityProvider implements IdentityProvider {
  private readonly logger = new Logger('MockIdentityProvider');

  async verify(data: IdentityRequest): Promise<IdentityResult> {
    this.logger.log(`[SIMULATED KYC] Verifying identity for ${data.fullName} (${data.documentType}: ${data.documentNumber})`);
    return {
      success: true,
      verified: true,
      details: {
        fullName: data.fullName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        matchScore: 0.97,
      },
    };
  }
}
