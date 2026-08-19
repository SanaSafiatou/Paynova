import { Injectable, Logger } from '@nestjs/common';
import { OcrProvider, OcrResult } from './provider.interface';

@Injectable()
export class MockOcrProvider implements OcrProvider {
  private readonly logger = new Logger('MockOcrProvider');

  async extractText(imageBase64: string): Promise<OcrResult> {
    this.logger.log(`[SIMULATED OCR] Processing image (${imageBase64.length} chars)`);
    return {
      success: true,
      texts: [
        { text: 'NOM: DUPONT JEAN', confidence: 0.95 },
        { text: 'N° CI: 123456789', confidence: 0.92 },
        { text: 'DATE NAISSANCE: 01/01/1990', confidence: 0.88 },
      ],
    };
  }
}
