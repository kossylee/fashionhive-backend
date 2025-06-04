import * as CryptoJS from 'crypto-js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MeasurementEncryptionService {
  private readonly key: string;

  constructor() {
    this.key = process.env.MEASUREMENT_AES_KEY || '';
    if (!this.key) {
      throw new Error('Encryption key not set in MEASUREMENT_AES_KEY');
    }
  }

  encrypt(plain: string): string {
    return CryptoJS.AES.encrypt(plain, this.key).toString();
  }

  decrypt(cipher: string): string {
    const bytes = CryptoJS.AES.decrypt(cipher, this.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
