import { randomBytes } from 'crypto';

export class IdGenerator {
  static generateId(): string {
    return randomBytes(16).toString('base64url').substring(0, 22);
  }
}
