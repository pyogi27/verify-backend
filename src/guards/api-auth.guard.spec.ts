import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiAuthGuard } from './api-auth.guard';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';

describe('ApiAuthGuard', () => {
  let guard: ApiAuthGuard;
  let applicationQueryService: ApplicationQueryService;
  let loggerService: LoggerService;

  const mockApplicationQueryService = {
    getApplicationByApiKey: jest.fn(),
  };

  const mockLoggerService = {
    logSecurity: jest.fn(),
    error: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      }),
    }),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiAuthGuard,
        {
          provide: ApplicationQueryService,
          useValue: mockApplicationQueryService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    guard = module.get<ApiAuthGuard>(ApiAuthGuard);
    applicationQueryService = module.get<ApplicationQueryService>(ApplicationQueryService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for valid API credentials', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockApplication: Partial<ApplicationOnboarding> = {
        application_id: 'test-app-id',
        application_name: 'TestApp',
        api_key: 'valid-api-key',
        api_secret: 'valid-api-secret',
        is_active: true,
        api_key_expiry: new Date(Date.now() + 86400000), // 1 day from now
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockResolvedValue(mockApplication);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockApplicationQueryService.getApplicationByApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Successful API Authentication', expect.any(Object));
    });

    it('should throw UnauthorizedException when API key is missing', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Missing Authentication Headers', expect.any(Object));
    });

    it('should throw UnauthorizedException when API secret is missing', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Missing Authentication Headers', expect.any(Object));
    });

    it('should throw UnauthorizedException when API key is invalid', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'invalid-api-key',
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockRejectedValue(new Error('Application not found'));

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Invalid API Key', expect.any(Object));
    });

    it('should throw UnauthorizedException when API secret is invalid', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
          'x-app-auth-secret': 'invalid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockApplication: Partial<ApplicationOnboarding> = {
        application_id: 'test-app-id',
        application_name: 'TestApp',
        api_key: 'valid-api-key',
        api_secret: 'correct-api-secret',
        is_active: true,
        api_key_expiry: new Date(Date.now() + 86400000),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockResolvedValue(mockApplication);

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Invalid API Secret', expect.any(Object));
    });

    it('should throw ForbiddenException when application is inactive', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockApplication: Partial<ApplicationOnboarding> = {
        application_id: 'test-app-id',
        application_name: 'TestApp',
        api_key: 'valid-api-key',
        api_secret: 'valid-api-secret',
        is_active: false,
        api_key_expiry: new Date(Date.now() + 86400000),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockResolvedValue(mockApplication);

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Inactive Application Access Attempt', expect.any(Object));
    });

    it('should throw ForbiddenException when API key is expired', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockApplication: Partial<ApplicationOnboarding> = {
        application_id: 'test-app-id',
        application_name: 'TestApp',
        api_key: 'valid-api-key',
        api_secret: 'valid-api-secret',
        is_active: true,
        api_key_expiry: new Date(Date.now() - 86400000), // 1 day ago
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockResolvedValue(mockApplication);

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Expired API Key Access Attempt', expect.any(Object));
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          'x-app-auth-key': 'valid-api-key',
          'x-app-auth-secret': 'valid-api-secret',
        },
        method: 'POST',
        url: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockApplicationQueryService.getApplicationByApiKey.mockRejectedValue(new Error('Unexpected error'));

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      expect(mockLoggerService.error).toHaveBeenCalledWith('Authentication service error', expect.any(String), 'ApiAuthGuard');
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key correctly', () => {
      // Arrange
      const apiKey = 'app_test_api_key_123456789';

      // Act
      const masked = (guard as any).maskApiKey(apiKey);

      // Assert
      expect(masked).toBe('app_***789');
    });

    it('should handle short API keys', () => {
      // Arrange
      const shortApiKey = 'short';

      // Act
      const masked = (guard as any).maskApiKey(shortApiKey);

      // Assert
      expect(masked).toBe('***');
    });

    it('should handle empty API key', () => {
      // Arrange
      const emptyApiKey = '';

      // Act
      const masked = (guard as any).maskApiKey(emptyApiKey);

      // Assert
      expect(masked).toBe('***');
    });
  });
}); 