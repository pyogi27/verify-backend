import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationController } from './application.controller';
import { ApplicationRegistrationService } from '../services/application.service';
import { KeyRotationService } from '../services/key-rotation.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import {
  ApplicationRegistrationRequestDto,
  ApplicationRegistrationResponseDto,
  ApplicationDto,
  ServiceDto,
  VerificationConfigDto,
} from '../dto/application-registration.dto';
import { KeyRotationResponseDto } from '../dto/key-rotation.dto';
import { ServiceType } from '../entities/service-type.enum';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

// Mock the ApiAuthGuard
const mockApiAuthGuard = {
  canActivate: jest.fn(() => true),
};

// Mock the AuthenticatedApplication decorator
const mockAuthenticatedApplication = () => ({
  application_id: 'test-app-id',
  application_name: 'TestApp',
  api_key: 'test-api-key',
  api_secret: 'test-api-secret',
});

describe('ApplicationController', () => {
  let controller: ApplicationController;
  let applicationService: ApplicationRegistrationService;
  let keyRotationService: KeyRotationService;
  let applicationQueryService: ApplicationQueryService;
  let loggerService: LoggerService;

  const mockApplicationService = {
    registerApplications: jest.fn(),
  };

  const mockKeyRotationService = {
    rotateKey: jest.fn(),
  };

  const mockApplicationQueryService = {
    getApplicationByApiKey: jest.fn(),
  };

  const mockLoggerService = {
    logSecurity: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        {
          provide: ApplicationRegistrationService,
          useValue: mockApplicationService,
        },
        { provide: KeyRotationService, useValue: mockKeyRotationService },
        {
          provide: ApplicationQueryService,
          useValue: mockApplicationQueryService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    })
      .overrideGuard('ApiAuthGuard')
      .useValue(mockApiAuthGuard)
      .compile();

    controller = module.get<ApplicationController>(ApplicationController);
    applicationService = module.get<ApplicationRegistrationService>(ApplicationRegistrationService);
    keyRotationService = module.get<KeyRotationService>(KeyRotationService);
    applicationQueryService = module.get<ApplicationQueryService>(ApplicationQueryService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerApplications', () => {
    const mockRequest: ApplicationRegistrationRequestDto = {
      data: [
        {
          applicationName: 'TestApp1',
          services: [
            {
              serviceType: ServiceType.AUTH_MO,
              verificationConfig: {
                maxResendCount: 3,
                maxAttemptCount: 3,
                tokenLength: 6,
                tokenPattern: 'N',
                expiryTime: 300,
              },
              successCallback: {
                callbackUrl: 'https://example.com/success',
                callbackMethod: 'POST',
                payload: {},
              },
              errorCallback: {
                callbackUrl: 'https://example.com/error',
                callbackMethod: 'POST',
                payload: {},
              },
            },
            {
              serviceType: ServiceType.VERIFY_EO,
              verificationConfig: {
                maxResendCount: 2,
                maxAttemptCount: 2,
                tokenLength: 4,
                tokenPattern: 'N',
                expiryTime: 180,
              },
              successCallback: {
                callbackUrl: 'https://example.com/success',
                callbackMethod: 'POST',
                payload: {},
              },
              errorCallback: {
                callbackUrl: 'https://example.com/error',
                callbackMethod: 'POST',
                payload: {},
              },
            },
          ],
        },
        {
          applicationName: 'TestApp2',
          services: [
            {
              serviceType: ServiceType.AUTH_EO,
              verificationConfig: {
                maxResendCount: 3,
                maxAttemptCount: 3,
                tokenLength: 6,
                tokenPattern: 'N',
                expiryTime: 300,
              },
              successCallback: {
                callbackUrl: 'https://example.com/success',
                callbackMethod: 'POST',
                payload: {},
              },
              errorCallback: {
                callbackUrl: 'https://example.com/error',
                callbackMethod: 'POST',
                payload: {},
              },
            },
            {
              serviceType: ServiceType.VERIFY_MO,
              verificationConfig: {
                maxResendCount: 2,
                maxAttemptCount: 2,
                tokenLength: 4,
                tokenPattern: 'N',
                expiryTime: 180,
              },
              successCallback: {
                callbackUrl: 'https://example.com/success',
                callbackMethod: 'POST',
                payload: {},
              },
              errorCallback: {
                callbackUrl: 'https://example.com/error',
                callbackMethod: 'POST',
                payload: {},
              },
            },
          ],
        },
      ],
    };

    const mockResponse: ApplicationRegistrationResponseDto = {
      data: [
        {
          applicationName: 'TestApp1',
          applicationCode: 'app-123-456-789',
          applicationKey: 'api-key-123',
          applicationKeySecret: 'api-secret-123',
          applicationKeyExpiry: 1782639419,
          servicesSubscribed: [ServiceType.AUTH_MO, ServiceType.VERIFY_EO],
        },
        {
          applicationName: 'TestApp2',
          applicationCode: 'app-987-654-321',
          applicationKey: 'api-key-456',
          applicationKeySecret: 'api-secret-456',
          applicationKeyExpiry: 1782639419,
          servicesSubscribed: [ServiceType.AUTH_EO, ServiceType.VERIFY_MO],
        },
      ],
      responseMessages: [
        {
          type: 'S',
          id: 'msg-123',
          text: 'Applications registered successfully',
        },
      ],
    };

    it('should register applications successfully', async () => {
      // Arrange
      mockApplicationService.registerApplications.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.registerApplications(mockRequest);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(mockRequest);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].applicationName).toBe('TestApp1');
      expect(result.data[0].applicationKey).toBe('api-key-123');
      expect(result.data[1].applicationName).toBe('TestApp2');
      expect(result.data[1].applicationKey).toBe('api-key-456');
      expect(result.responseMessages[0].type).toBe('S');
    });

    it('should handle duplicate application name', async () => {
      // Arrange
      const conflictError = new ConflictException('Application name already exists');
      mockApplicationService.registerApplications.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.registerApplications(mockRequest)).rejects.toThrow(ConflictException);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Invalid application data');
      mockApplicationService.registerApplications.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.registerApplications(mockRequest)).rejects.toThrow(Error);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new InternalServerErrorException('Database connection failed');
      mockApplicationService.registerApplications.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.registerApplications(mockRequest)).rejects.toThrow(InternalServerErrorException);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle single application registration', async () => {
      // Arrange
      const singleRequest: ApplicationRegistrationRequestDto = {
        data: [
          {
            applicationName: 'SingleApp',
            services: [
              {
                serviceType: ServiceType.AUTH_MO,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
            ],
          },
        ],
      };

      const singleResponse: ApplicationRegistrationResponseDto = {
        data: [
          {
            applicationName: 'SingleApp',
            applicationCode: 'app-single-123',
            applicationKey: 'api-key-single',
            applicationKeySecret: 'api-secret-single',
            applicationKeyExpiry: 1782639419,
            servicesSubscribed: [ServiceType.AUTH_MO],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-single',
            text: 'Single application registered successfully',
          },
        ],
      };

      mockApplicationService.registerApplications.mockResolvedValue(singleResponse);

      // Act
      const result = await controller.registerApplications(singleRequest);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].applicationName).toBe('SingleApp');
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_MO);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(singleRequest);
    });

    it('should handle all service types', async () => {
      // Arrange
      const allServicesRequest: ApplicationRegistrationRequestDto = {
        data: [
          {
            applicationName: 'AllServicesApp',
            services: [
              {
                serviceType: ServiceType.AUTH_MO,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
              {
                serviceType: ServiceType.AUTH_EO,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
              {
                serviceType: ServiceType.VERIFY_MO,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
              {
                serviceType: ServiceType.VERIFY_EO,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
              {
                serviceType: ServiceType.VERIFY_EL,
                verificationConfig: {
                  maxResendCount: 3,
                  maxAttemptCount: 3,
                  tokenLength: 6,
                  tokenPattern: 'N',
                  expiryTime: 300,
                },
                successCallback: {
                  callbackUrl: 'https://example.com/success',
                  callbackMethod: 'POST',
                  payload: {},
                },
                errorCallback: {
                  callbackUrl: 'https://example.com/error',
                  callbackMethod: 'POST',
                  payload: {},
                },
              },
            ],
          },
        ],
      };

      const allServicesResponse: ApplicationRegistrationResponseDto = {
        data: [
          {
            applicationName: 'AllServicesApp',
            applicationCode: 'app-all-123',
            applicationKey: 'api-key-all',
            applicationKeySecret: 'api-secret-all',
            applicationKeyExpiry: 1782639419,
            servicesSubscribed: [ServiceType.AUTH_MO, ServiceType.AUTH_EO, ServiceType.VERIFY_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-all',
            text: 'Application with all services registered successfully',
          },
        ],
      };

      mockApplicationService.registerApplications.mockResolvedValue(allServicesResponse);

      // Act
      const result = await controller.registerApplications(allServicesRequest);

      // Assert
      expect(result.data[0].servicesSubscribed).toHaveLength(5);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_MO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_EO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_MO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_EO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_EL);
      expect(mockApplicationService.registerApplications).toHaveBeenCalledWith(allServicesRequest);
    });
  });

  describe('rotateKey', () => {
    const mockKeyRotationResponse: KeyRotationResponseDto = {
      data: [
        {
          applicationName: 'TestApp',
          applicationCode: 'test-app-id',
          applicationKey: 'new-api-key-123',
          applicationKeySecret: 'new-api-secret-123',
          applicationKeyExpiry: 1782639419,
        },
      ],
      responseMessages: [
        {
          type: 'S',
          id: 'msg-rotation',
          text: 'API key rotated successfully',
        },
      ],
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Key rotation completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should rotate API key successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      mockKeyRotationService.rotateKey.mockResolvedValue(mockKeyRotationResponse);

      // Act
      const result = await controller.rotateKey(applicationCode, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockKeyRotationResponse);
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
      expect(result.data[0].applicationCode).toBe('test-app-id');
      expect(result.data[0].applicationKey).toBe('new-api-key-123');
      expect(result.data[0].applicationKeySecret).toBe('new-api-secret-123');
      expect(result.responseMessages[0].type).toBe('S');
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const notFoundError = new NotFoundException('Application not found');
      mockKeyRotationService.rotateKey.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.rotateKey(applicationCode, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const forbiddenError = new Error('Application is inactive');
      mockKeyRotationService.rotateKey.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.rotateKey(applicationCode, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const dbError = new InternalServerErrorException('Database connection failed');
      mockKeyRotationService.rotateKey.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.rotateKey(applicationCode, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const differentResponse: KeyRotationResponseDto = {
        data: [
          {
            applicationName: 'DifferentApp',
            applicationCode: 'different-app-code',
            applicationKey: 'different-api-key',
            applicationKeySecret: 'different-api-secret',
            applicationKeyExpiry: 1782639419,
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-diff',
            text: 'API key rotated for different app',
          },
        ],
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Key rotation completed successfully',
          },
        },
      };

      mockKeyRotationService.rotateKey.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.rotateKey(applicationCode, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].applicationCode).toBe(applicationCode);
      expect(result.data[0].applicationKey).toBe('different-api-key');
      expect(result.responseMessages[0].text).toBe('API key rotated for different app');
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
    });

    it('should handle field messages in response', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const fieldMessageResponse: KeyRotationResponseDto = {
        data: [
          {
            applicationName: 'TestApp',
            applicationCode: 'test-app-id',
            applicationKey: 'new-api-key-field',
            applicationKeySecret: 'new-api-secret-field',
            applicationKeyExpiry: 1782639419,
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-field',
            text: 'API key rotated with warnings',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning',
              text: 'Previous API key will expire in 24 hours',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Key rotation completed successfully',
          },
        },
      };

      mockKeyRotationService.rotateKey.mockResolvedValue(fieldMessageResponse);

      // Act
      const result = await controller.rotateKey(applicationCode, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[0].text).toBe('Previous API key will expire in 24 hours');
      expect(mockKeyRotationService.rotateKey).toHaveBeenCalledWith(applicationCode, mockAuthenticatedApp.application_id);
    });
  });
}); 