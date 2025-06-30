import { Test, TestingModule } from '@nestjs/testing';
import { ResendVerificationController } from './resend-verification.controller';
import { ResendVerificationService } from '../services/resend-verification.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { ResendVerificationMainRequestDto, ResendVerificationMainResponseDto } from '../dto/resend-verification.dto';
import { ServiceType } from '../entities/service-type.enum';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('ResendVerificationController', () => {
  let controller: ResendVerificationController;
  let resendVerificationService: ResendVerificationService;

  const mockResendVerificationService = {
    resendVerification: jest.fn(),
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
      controllers: [ResendVerificationController],
      providers: [
        { provide: ResendVerificationService, useValue: mockResendVerificationService },
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

    controller = module.get<ResendVerificationController>(ResendVerificationController);
    resendVerificationService = module.get<ResendVerificationService>(ResendVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resendVerification', () => {
    const mockRequest: ResendVerificationMainRequestDto = {
      data: [
        {
          requestId: 'req-123-456-789',
        },
        {
          requestId: 'req-987-654-321',
        },
      ],
    };

    const mockResponse: ResendVerificationMainResponseDto = {
      data: [
        {
          userIdentity: '+1234567890',
          serviceType: ServiceType.AUTH_MO,
          requestId: 'req-123-456-789',
        },
        {
          userIdentity: 'user@example.com',
          serviceType: ServiceType.VERIFY_EO,
          requestId: 'req-987-654-321',
        },
      ],
      responseMessages: {
        type: 'S',
        id: 'msg-123',
        text: 'Verification tokens resent successfully',
      },
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Resend verification completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should resend verification tokens successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      mockResendVerificationService.resendVerification.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].requestId).toBe('req-123-456-789');
      expect(result.data[0].userIdentity).toBe('+1234567890');
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[1].requestId).toBe('req-987-654-321');
      expect(result.data[1].userIdentity).toBe('user@example.com');
      expect(result.data[1].serviceType).toBe(ServiceType.VERIFY_EO);
      expect(result.responseMessages.type).toBe('S');
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const notFoundError = new NotFoundException('Application not found');
      mockResendVerificationService.resendVerification.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle verification request not found', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const notFoundError = new NotFoundException('Verification request not found');
      mockResendVerificationService.resendVerification.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const forbiddenError = new Error('Application is inactive');
      mockResendVerificationService.resendVerification.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle expired verification request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const expiredError = new Error('Verification request expired');
      mockResendVerificationService.resendVerification.mockRejectedValue(expiredError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle max resend attempts exceeded', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const maxResendError = new Error('Maximum resend attempts exceeded');
      mockResendVerificationService.resendVerification.mockRejectedValue(maxResendError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle already verified request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const alreadyVerifiedError = new ConflictException('Verification request already verified');
      mockResendVerificationService.resendVerification.mockRejectedValue(alreadyVerifiedError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(ConflictException);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const dbError = new InternalServerErrorException('Database connection failed');
      mockResendVerificationService.resendVerification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle single request resend', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const singleRequest: ResendVerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-single-123',
          },
        ],
      };

      const singleResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-single-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-single',
          text: 'Single verification token resent successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(singleResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, singleRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].requestId).toBe('req-single-123');
      expect(result.data[0].userIdentity).toBe('+1234567890');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, singleRequest);
    });

    it('should handle multiple request resend', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const multiRequest: ResendVerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-mo-1',
          },
          {
            requestId: 'req-eo-1',
          },
          {
            requestId: 'req-vmo-1',
          },
          {
            requestId: 'req-veo-1',
          },
          {
            requestId: 'req-vel-1',
          },
        ],
      };

      const multiResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1111111111',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-mo-1',
          },
          {
            userIdentity: 'user1@example.com',
            serviceType: ServiceType.AUTH_EO,
            requestId: 'req-eo-1',
          },
          {
            userIdentity: '+2222222222',
            serviceType: ServiceType.VERIFY_MO,
            requestId: 'req-vmo-1',
          },
          {
            userIdentity: 'user2@example.com',
            serviceType: ServiceType.VERIFY_EO,
            requestId: 'req-veo-1',
          },
          {
            userIdentity: 'user3@example.com',
            serviceType: ServiceType.VERIFY_EL,
            requestId: 'req-vel-1',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-multi',
          text: 'Multiple verification tokens resent successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(multiResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, multiRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[1].serviceType).toBe(ServiceType.AUTH_EO);
      expect(result.data[2].serviceType).toBe(ServiceType.VERIFY_MO);
      expect(result.data[3].serviceType).toBe(ServiceType.VERIFY_EO);
      expect(result.data[4].serviceType).toBe(ServiceType.VERIFY_EL);
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, multiRequest);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const differentResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+9999999999',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-diff-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-diff',
          text: 'Verification token resent for different app',
        },
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.data[0].userIdentity).toBe('+9999999999');
      expect(result.responseMessages.text).toBe('Verification token resent for different app');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle all service types', async () => {
      // Test all service types
      const serviceTypes = [ServiceType.AUTH_MO, ServiceType.AUTH_EO, ServiceType.VERIFY_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL];
      
      for (const serviceType of serviceTypes) {
        // Arrange
        const applicationCode = 'test-app-id';
        const serviceSpecificRequest: ResendVerificationMainRequestDto = {
          data: [
            {
              requestId: `req-${serviceType}-123`,
            },
          ],
        };

        const serviceSpecificResponse: ResendVerificationMainResponseDto = {
          data: [
            {
              userIdentity: serviceType.includes('MO') ? '+1234567890' : 'user@example.com',
              serviceType,
              requestId: `req-${serviceType}-123`,
            },
          ],
          responseMessages: {
            type: 'S',
            id: `msg-${serviceType}`,
            text: `${serviceType} verification token resent successfully`,
          },
          messages: {
            resourceId: 'test-app-id',
            fieldMessages: [],
            resourceMessages: {
              type: 'S',
              text: 'Resend verification completed successfully',
            },
          },
        };

        mockResendVerificationService.resendVerification.mockResolvedValue(serviceSpecificResponse);

        // Act
        const result = await controller.resendVerification(applicationCode, serviceSpecificRequest, mockAuthenticatedApp);

        // Assert
        expect(result.data[0].serviceType).toBe(serviceType);
        expect(result.responseMessages.text).toBe(`${serviceType} verification token resent successfully`);
        expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, serviceSpecificRequest);
      }
    });

    it('should handle empty request data', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const emptyRequest: ResendVerificationMainRequestDto = {
        data: [],
      };

      const emptyResponse: ResendVerificationMainResponseDto = {
        data: [],
        responseMessages: {
          type: 'S',
          id: 'msg-empty',
          text: 'No verification requests to resend',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, emptyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.responseMessages.text).toBe('No verification requests to resend');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, emptyRequest);
    });

    it('should handle field messages in response', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const fieldMessageResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-field-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-field',
          text: 'Verification token resent with warnings',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning',
              text: 'User has multiple active requests',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(fieldMessageResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[0].text).toBe('User has multiple active requests');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle multiple field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const multiFieldResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-multi-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-multi',
          text: 'Verification token resent with multiple warnings',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning-1',
              text: 'User has multiple active requests',
            },
            {
              type: 'W',
              id: 'field-warning-2',
              text: 'Previous token was close to expiry',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(multiFieldResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(2);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[1].type).toBe('W');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle error field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const errorFieldResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-error-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-error',
          text: 'Verification token resent with errors',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'E',
              id: 'field-error',
              text: 'Failed to send SMS notification',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(errorFieldResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('E');
      expect(result.messages.fieldMessages[0].text).toBe('Failed to send SMS notification');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle different user identity formats', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const differentFormatsRequest: ResendVerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-format-1',
          },
          {
            requestId: 'req-format-2',
          },
        ],
      };

      const differentFormatsResponse: ResendVerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1-234-567-8900', // Different phone format
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-format-1',
          },
          {
            userIdentity: 'USER@EXAMPLE.COM', // Different email format
            serviceType: ServiceType.AUTH_EO,
            requestId: 'req-format-2',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-format',
          text: 'Verification tokens resent with different formats',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Resend verification completed successfully',
          },
        },
      };

      mockResendVerificationService.resendVerification.mockResolvedValue(differentFormatsResponse);

      // Act
      const result = await controller.resendVerification(applicationCode, differentFormatsRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].userIdentity).toBe('+1-234-567-8900');
      expect(result.data[1].userIdentity).toBe('USER@EXAMPLE.COM');
      expect(mockResendVerificationService.resendVerification).toHaveBeenCalledWith(applicationCode, differentFormatsRequest);
    });
  });
}); 