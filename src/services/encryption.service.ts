import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    // Get encryption key from environment or use a default (should be set in production)
    this.encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'your-secret-encryption-key-32-chars-long',
    );
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    if (!text) return text;

    const encrypted = CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    return encrypted;
  }

  /**
   * Decrypt an encrypted string value
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt API key
   */
  encryptApiKey(apiKey: string): string {
    return this.encrypt(apiKey);
  }

  /**
   * Decrypt API key
   */
  decryptApiKey(encryptedApiKey: string): string {
    return this.decrypt(encryptedApiKey);
  }

  /**
   * Encrypt API secret
   */
  encryptApiSecret(apiSecret: string): string {
    return this.encrypt(apiSecret);
  }

  /**
   * Decrypt API secret
   */
  decryptApiSecret(encryptedApiSecret: string): string {
    return this.decrypt(encryptedApiSecret);
  }
}
