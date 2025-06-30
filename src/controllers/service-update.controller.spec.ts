import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUpdateController } from './service-update.controller';
import { ServiceUpdateService } from '../services/service-update.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { ServiceUpdateMainRequestDto, ServiceUpdateMainResponseDto } from '../dto/service-update.dto';
import { ServiceType } from '../entities/service-type.enum';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('ServiceUpdateController', () => {
  let controller: ServiceUpdateController;
  let serviceUpdateService: ServiceUpdateService;

  const mockServiceUpdateService = {
    updateService: jest.fn(),
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
      controllers: [ServiceUpdateController],
      providers: [
        { provide: ServiceUpdateService, useValue: mockServiceUpdateService },
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

    controller = module.get<ServiceUpdateController>(ServiceUpdateController);
    serviceUpdateService = module.get<ServiceUpdateService>(ServiceUpdateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateService', () => {
    const mockRequest: ServiceUpdateMainRequestDto = {
      data: [
        {
          verificationLinkRoute: 'https://updated-example.com/verify',
          verificationConfig: {
            maxResendCount: 5,
            maxAttemptCount: 5,
            tokenLength: 8,
            tokenPattern: 'A',
            expiryTime: 600,
          },
          successCallback: {
            callbackUrl: 'https://updated-example.com/success',
            callbackMethod: 'POST',
            payload: { updated: true },
          },
          errorCallback: {
            callbackUrl: 'https://updated-example.com/error',
            callbackMethod: 'POST',
            payload: { error: 'updated' },
          },
        },
      ],
    };

    const mockResponse: ServiceUpdateMainResponseDto = {
      data: [null],
      responseMessages: {
        type: 'S',
        id: 'msg-123',
        text: 'Service updated successfully',
      },
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Service update completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should update service successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EL;
      mockServiceUpdateService.updateService.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
      expect(result.responseMessages.type).toBe('S');
      expect(result.messages?.resourceId).toBe(applicationCode);
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const serviceType = ServiceType.AUTH_MO;
      const notFoundError = new NotFoundException('Application not found');
      mockServiceUpdateService.updateService.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle service not found', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EO;
      const notFoundError = new NotFoundException('Service not found for this application');
      mockServiceUpdateService.updateService.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const serviceType = ServiceType.AUTH_EO;
      const forbiddenError = new Error('Application is inactive');
      mockServiceUpdateService.updateService.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_MO;
      const validationError = new Error('Invalid service configuration');
      mockServiceUpdateService.updateService.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_MO;
      const dbError = new InternalServerErrorException('Database connection failed');
      mockServiceUpdateService.updateService.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle update with only verification config', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_MO;
      const configOnlyRequest: ServiceUpdateMainRequestDto = {
        data: [
          {
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
      };

      const configOnlyResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-config',
          text: 'Verification config updated successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(configOnlyResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, configOnlyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.responseMessages.text).toBe('Verification config updated successfully');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, configOnlyRequest);
      expect(result.messages?.resourceId).toBe(applicationCode);
    });

    it('should handle update with only callback URLs', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EO;
      const callbackOnlyRequest: ServiceUpdateMainRequestDto = {
        data: [
          {
            successCallback: {
              callbackUrl: 'https://new-callback.com/success',
              callbackMethod: 'POST',
              payload: { new: true },
            },
            errorCallback: {
              callbackUrl: 'https://new-callback.com/error',
              callbackMethod: 'POST',
              payload: { error: 'new' },
            },
          },
        ],
      };

      const callbackOnlyResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-callback',
          text: 'Callback URLs updated successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(callbackOnlyResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, callbackOnlyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.responseMessages.text).toBe('Callback URLs updated successfully');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, callbackOnlyRequest);
    });

    it('should handle update for email verification link service', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EL;
      const linkServiceRequest: ServiceUpdateMainRequestDto = {
        data: [
          {
            verificationLinkRoute: 'https://new-verify-link.com/verify',
            verificationConfig: {
              maxResendCount: 1,
              maxAttemptCount: 1,
              tokenLength: 10,
              tokenPattern: 'A',
              expiryTime: 900,
            },
            successCallback: {
              callbackUrl: 'https://link-success.com/success',
              callbackMethod: 'POST',
              payload: {},
            },
            errorCallback: {
              callbackUrl: 'https://link-error.com/error',
              callbackMethod: 'POST',
              payload: {},
            },
          },
        ],
      };

      const linkServiceResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-link',
          text: 'Email verification link service updated successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(linkServiceResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, linkServiceRequest, mockAuthenticatedApp);

      // Assert
      expect(result.responseMessages.text).toBe('Email verification link service updated successfully');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, linkServiceRequest);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const serviceType = ServiceType.AUTH_MO;
      const differentResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-diff',
          text: 'Service updated for different app',
        },
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.responseMessages.text).toBe('Service updated for different app');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
    });

    it('should handle all service types', async () => {
      // Test all service types
      const serviceTypes = [ServiceType.AUTH_MO, ServiceType.AUTH_EO, ServiceType.VERIFY_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL];
      
      for (const serviceType of serviceTypes) {
        // Arrange
        const applicationCode = 'test-app-id';
        const serviceSpecificResponse: ServiceUpdateMainResponseDto = {
          data: [null],
          responseMessages: {
            type: 'S',
            id: `msg-${serviceType}`,
            text: `${serviceType} service updated successfully`,
          },
          messages: {
            resourceId: 'test-app-id',
            fieldMessages: [],
            resourceMessages: {
              type: 'S',
              text: 'Service update completed successfully',
            },
          },
        };

        mockServiceUpdateService.updateService.mockResolvedValue(serviceSpecificResponse);

        // Act
        const result = await controller.updateService(applicationCode, serviceType, mockRequest, mockAuthenticatedApp);

        // Assert
        expect(result.responseMessages.text).toBe(`${serviceType} service updated successfully`);
        expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, mockRequest);
      }
    });

    it('should handle empty update request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_EO;
      const emptyRequest: ServiceUpdateMainRequestDto = {
        data: [{}],
      };

      const emptyResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-empty',
          text: 'No changes to update',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, emptyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.responseMessages.text).toBe('No changes to update');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, emptyRequest);
    });

    it('should handle partial update with only some fields', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_MO;
      const partialRequest: ServiceUpdateMainRequestDto = {
        data: [
          {
            verificationConfig: {
              maxResendCount: 4,
              maxAttemptCount: 4,
              tokenLength: 6,
              tokenPattern: 'N',
              expiryTime: 300,
            },
            // Missing successCallback and errorCallback
          },
        ],
      };

      const partialResponse: ServiceUpdateMainResponseDto = {
        data: [null],
        responseMessages: {
          type: 'S',
          id: 'msg-partial',
          text: 'Partial update completed successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service update completed successfully',
          },
        },
      };

      mockServiceUpdateService.updateService.mockResolvedValue(partialResponse);

      // Act
      const result = await controller.updateService(applicationCode, serviceType, partialRequest, mockAuthenticatedApp);

      // Assert
      expect(result.responseMessages.text).toBe('Partial update completed successfully');
      expect(mockServiceUpdateService.updateService).toHaveBeenCalledWith(applicationCode, serviceType, partialRequest);
    });
  });
}); 