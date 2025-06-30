import { Test, TestingModule } from '@nestjs/testing';
import { ServiceAdditionController } from './service-addition.controller';
import { ServiceAdditionService } from '../services/service-addition.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { ServiceAdditionRequestDto, ServiceAdditionMainResponseDto } from '../dto/service-addition.dto';
import { ServiceType } from '../entities/service-type.enum';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('ServiceAdditionController', () => {
  let controller: ServiceAdditionController;
  let serviceAdditionService: ServiceAdditionService;

  const mockServiceAdditionService = {
    addServices: jest.fn(),
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
      controllers: [ServiceAdditionController],
      providers: [
        { provide: ServiceAdditionService, useValue: mockServiceAdditionService },
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

    controller = module.get<ServiceAdditionController>(ServiceAdditionController);
    serviceAdditionService = module.get<ServiceAdditionService>(ServiceAdditionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addServices', () => {
    const mockRequest: ServiceAdditionRequestDto = {
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
            callbackUrl: 'https://example.com/success-mo',
            callbackMethod: 'POST',
            payload: {},
          },
          errorCallback: {
            callbackUrl: 'https://example.com/error-mo',
            callbackMethod: 'POST',
            payload: {},
          },
        },
      ],
    };

    const mockResponse: ServiceAdditionMainResponseDto = {
      data: [
        {
          servicesSubscribed: [ServiceType.AUTH_EO, ServiceType.VERIFY_MO],
        },
      ],
      responseMessages: [
        {
          type: 'S',
          id: 'msg-123',
          text: 'Services added successfully',
        },
      ],
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Service addition completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should add services successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      mockServiceAdditionService.addServices.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_EO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_MO);
      expect(result.responseMessages[0].type).toBe('S');
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const notFoundError = new NotFoundException('Application not found');
      mockServiceAdditionService.addServices.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle service already exists', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const conflictError = new ConflictException('Service already exists for this application');
      mockServiceAdditionService.addServices.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(ConflictException);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const forbiddenError = new Error('Application is inactive');
      mockServiceAdditionService.addServices.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const validationError = new Error('Invalid service configuration');
      mockServiceAdditionService.addServices.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const dbError = new InternalServerErrorException('Database connection failed');
      mockServiceAdditionService.addServices.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle single service addition', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const singleServiceRequest: ServiceAdditionRequestDto = {
        services: [
          {
            serviceType: ServiceType.VERIFY_EL,
            verificationLinkRoute: 'https://example.com/verify',
            verificationConfig: {
              maxResendCount: 1,
              maxAttemptCount: 1,
              tokenLength: 8,
              tokenPattern: 'A',
              expiryTime: 600,
            },
            successCallback: {
              callbackUrl: 'https://example.com/success-link',
              callbackMethod: 'POST',
              payload: {},
            },
            errorCallback: {
              callbackUrl: 'https://example.com/error-link',
              callbackMethod: 'POST',
              payload: {},
            },
          },
        ],
      };

      const singleServiceResponse: ServiceAdditionMainResponseDto = {
        data: [
          {
            servicesSubscribed: [ServiceType.VERIFY_EL],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-single',
            text: 'Service added successfully',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service addition completed successfully',
          },
        },
      };

      mockServiceAdditionService.addServices.mockResolvedValue(singleServiceResponse);

      // Act
      const result = await controller.addServices(applicationCode, singleServiceRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].servicesSubscribed).toHaveLength(1);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_EL);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, singleServiceRequest);
    });

    it('should handle multiple services with different configurations', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const multiServiceRequest: ServiceAdditionRequestDto = {
        services: [
          {
            serviceType: ServiceType.AUTH_MO,
            verificationConfig: {
              maxResendCount: 5,
              maxAttemptCount: 5,
              tokenLength: 6,
              tokenPattern: 'N',
              expiryTime: 300,
            },
            successCallback: {
              callbackUrl: 'https://mobile.com/success',
              callbackMethod: 'POST',
              payload: {},
            },
            errorCallback: {
              callbackUrl: 'https://mobile.com/error',
              callbackMethod: 'POST',
              payload: {},
            },
          },
          {
            serviceType: ServiceType.VERIFY_EO,
            verificationConfig: {
              maxResendCount: 3,
              maxAttemptCount: 3,
              tokenLength: 4,
              tokenPattern: 'N',
              expiryTime: 180,
            },
            successCallback: {
              callbackUrl: 'https://email.com/success',
              callbackMethod: 'POST',
              payload: {},
            },
            errorCallback: {
              callbackUrl: 'https://email.com/error',
              callbackMethod: 'POST',
              payload: {},
            },
          },
          {
            serviceType: ServiceType.VERIFY_EL,
            verificationLinkRoute: 'https://example.com/verify-link',
            verificationConfig: {
              maxResendCount: 1,
              maxAttemptCount: 1,
              tokenLength: 10,
              tokenPattern: 'A',
              expiryTime: 900,
            },
            successCallback: {
              callbackUrl: 'https://link.com/success',
              callbackMethod: 'POST',
              payload: {},
            },
            errorCallback: {
              callbackUrl: 'https://link.com/error',
              callbackMethod: 'POST',
              payload: {},
            },
          },
        ],
      };

      const multiServiceResponse: ServiceAdditionMainResponseDto = {
        data: [
          {
            servicesSubscribed: [ServiceType.AUTH_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-multi',
            text: 'Multiple services added successfully',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service addition completed successfully',
          },
        },
      };

      mockServiceAdditionService.addServices.mockResolvedValue(multiServiceResponse);

      // Act
      const result = await controller.addServices(applicationCode, multiServiceRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].servicesSubscribed).toHaveLength(3);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_MO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_EO);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.VERIFY_EL);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, multiServiceRequest);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const differentResponse: ServiceAdditionMainResponseDto = {
        data: [
          {
            servicesSubscribed: [ServiceType.AUTH_EO],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-diff',
            text: 'Service added to different app',
          },
        ],
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service addition completed successfully',
          },
        },
      };

      mockServiceAdditionService.addServices.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.addServices(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_EO);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle empty services array', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const emptyRequest: ServiceAdditionRequestDto = {
        services: [],
      };

      const emptyResponse: ServiceAdditionMainResponseDto = {
        data: [
          {
            servicesSubscribed: [],
          },
        ],
        responseMessages: [
          {
            type: 'S',
            id: 'msg-empty',
            text: 'No services to add',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'No services added',
          },
        },
      };

      mockServiceAdditionService.addServices.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.addServices(applicationCode, emptyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].servicesSubscribed).toHaveLength(0);
      expect(mockServiceAdditionService.addServices).toHaveBeenCalledWith(applicationCode, emptyRequest);
    });
  });
}); 