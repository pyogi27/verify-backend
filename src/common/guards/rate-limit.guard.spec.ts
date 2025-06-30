import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitGuard } from './rate-limit.guard';
import { Request } from 'express';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitGuard],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  describe('getTracker', () => {
    it('should return API key when present in headers', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'test-api-key-123',
        },
        ip: '127.0.0.1',
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('test-api-key-123');
    });

    it('should return IP address when API key is not present', async () => {
      // Arrange
      const mockRequest = {
        headers: {},
        ip: '192.168.1.100',
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('192.168.1.100');
    });

    it('should return "unknown" when neither API key nor IP is present', async () => {
      // Arrange
      const mockRequest = {
        headers: {},
        ip: undefined,
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('unknown');
    });

    it('should prioritize API key over IP address', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'priority-api-key',
        },
        ip: '10.0.0.1',
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('priority-api-key');
    });

    it('should handle empty API key string', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': '',
        },
        ip: '127.0.0.1',
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('127.0.0.1');
    });

    it('should handle whitespace-only API key', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': '   ',
        },
        ip: '127.0.0.1',
      } as Request;

      // Act
      const result = await guard.getTracker(mockRequest);

      // Assert
      expect(result).toBe('127.0.0.1');
    });
  });
}); 