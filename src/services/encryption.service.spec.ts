import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encryption and decryption', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-encryption-key-32-chars-long');
    });

    it('should encrypt and decrypt text correctly', () => {
      // Arrange
      const originalText = 'test-secret-data';

      // Act
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      // Assert
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toMatch(/^U2FsdGVkX1/); // AES encrypted text starts with this
      expect(decrypted).toBe(originalText);
    });

    it('should handle empty string', () => {
      // Arrange
      const emptyString = '';

      // Act
      const encrypted = service.encrypt(emptyString);
      const decrypted = service.decrypt(encrypted);

      // Assert
      expect(encrypted).toBe(emptyString);
      expect(decrypted).toBe(emptyString);
    });

    it('should handle null/undefined values', () => {
      // Act
      const encryptedNull = service.encrypt(null as any);
      const encryptedUndefined = service.encrypt(undefined as any);
      const decryptedNull = service.decrypt(null as any);
      const decryptedUndefined = service.decrypt(undefined as any);

      // Assert
      expect(encryptedNull).toBeNull();
      expect(encryptedUndefined).toBeUndefined();
      expect(decryptedNull).toBeNull();
      expect(decryptedUndefined).toBeUndefined();
    });

    it('should throw error when decrypting invalid data', () => {
      // Arrange
      const invalidEncryptedText = 'invalid-encrypted-text';

      // Act & Assert
      expect(() => service.decrypt(invalidEncryptedText)).toThrow('Failed to decrypt data');
    });
  });

  describe('API key encryption', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-encryption-key-32-chars-long');
    });

    it('should encrypt and decrypt API key correctly', () => {
      // Arrange
      const originalApiKey = 'app_test_api_key_123';

      // Act
      const encrypted = service.encryptApiKey(originalApiKey);
      const decrypted = service.decryptApiKey(encrypted);

      // Assert
      expect(encrypted).not.toBe(originalApiKey);
      expect(decrypted).toBe(originalApiKey);
    });
  });

  describe('API secret encryption', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-encryption-key-32-chars-long');
    });

    it('should encrypt and decrypt API secret correctly', () => {
      // Arrange
      const originalApiSecret = 'test-api-secret-456';

      // Act
      const encrypted = service.encryptApiSecret(originalApiSecret);
      const decrypted = service.decryptApiSecret(encrypted);

      // Assert
      expect(encrypted).not.toBe(originalApiSecret);
      expect(decrypted).toBe(originalApiSecret);
    });
  });

  describe('configuration', () => {
    it('should use default encryption key when not provided', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);

      // Act
      const serviceWithDefault = new EncryptionService(configService);
      const originalText = 'test-data';
      const encrypted = serviceWithDefault.encrypt(originalText);
      const decrypted = serviceWithDefault.decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(originalText);
    });

    it('should use provided encryption key from config', () => {
      // Arrange
      const customKey = 'custom-encryption-key-32-chars-long';
      mockConfigService.get.mockReturnValue(customKey);

      // Act
      const serviceWithCustom = new EncryptionService(configService);
      const originalText = 'test-data';
      const encrypted = serviceWithCustom.encrypt(originalText);
      const decrypted = serviceWithCustom.decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(originalText);
    });
  });
}); 