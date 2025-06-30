import { Test, TestingModule } from '@nestjs/testing';
import { VerificationController } from './verification.controller';
import { VerificationService } from '../services/verification.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { VerificationMainRequestDto, VerificationMainResponseDto } from '../dto/verification.dto';
import { ServiceType } from '../entities/service-type.enum';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('VerificationController', () => {
  let controller: VerificationController;
  let verificationService: VerificationService;

  const mockVerificationService = {
    verifyTokens: jest.fn(),
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
      controllers: [VerificationController],
      providers: [
        { provide: VerificationService, useValue: mockVerificationService },
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

    controller = module.get<VerificationController>(VerificationController);
    verificationService = module.get<VerificationService>(VerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyTokens', () => {
    const mockRequest: VerificationMainRequestDto = {
      data: [
        {
          requestId: 'req-123-456-789',
          token: '123456',
        },
        {
          requestId: 'req-987-654-321',
          token: '789012',
        },
      ],
    };

    const mockResponse: VerificationMainResponseDto = {
      data: [
        {
          userIdentity: '+1234567890',
          serviceType: ServiceType.AUTH_MO,
          requestId: 'req-123-456-789',
          verificationStatus: 'SUCCESS',
        },
        {
          userIdentity: 'user@example.com',
          serviceType: ServiceType.VERIFY_EO,
          requestId: 'req-987-654-321',
          verificationStatus: 'SUCCESS',
        },
      ],
      responseMessages: {
        type: 'S',
        id: 'msg-123',
        text: 'Verification completed successfully',
      },
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Verification completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should verify tokens successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      mockVerificationService.verifyTokens.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].requestId).toBe('req-123-456-789');
      expect(result.data[0].verificationStatus).toBe('SUCCESS');
      expect(result.data[1].requestId).toBe('req-987-654-321');
      expect(result.data[1].verificationStatus).toBe('SUCCESS');
      expect(result.responseMessages.type).toBe('S');
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const notFoundError = new NotFoundException('Application not found');
      mockVerificationService.verifyTokens.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle verification request not found', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const notFoundError = new NotFoundException('Verification request not found');
      mockVerificationService.verifyTokens.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const forbiddenError = new Error('Application is inactive');
      mockVerificationService.verifyTokens.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle invalid token', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const invalidTokenError = new Error('Invalid token provided');
      mockVerificationService.verifyTokens.mockRejectedValue(invalidTokenError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle expired verification request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const expiredError = new Error('Verification request expired');
      mockVerificationService.verifyTokens.mockRejectedValue(expiredError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle max attempts exceeded', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const maxAttemptsError = new Error('Maximum verification attempts exceeded');
      mockVerificationService.verifyTokens.mockRejectedValue(maxAttemptsError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle already verified request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const alreadyVerifiedError = new Error('Verification request already verified');
      mockVerificationService.verifyTokens.mockRejectedValue(alreadyVerifiedError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const dbError = new InternalServerErrorException('Database connection failed');
      mockVerificationService.verifyTokens.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle single token verification', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const singleRequest: VerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-single-123',
            token: '123456',
          },
        ],
      };

      const singleResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-single-123',
            verificationStatus: 'SUCCESS',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-single',
          text: 'Single token verified successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(singleResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, singleRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].requestId).toBe('req-single-123');
      expect(result.data[0].verificationStatus).toBe('SUCCESS');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, singleRequest);
    });

    it('should handle multiple token verification', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const multiRequest: VerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-mo-1',
            token: '123456',
          },
          {
            requestId: 'req-eo-1',
            token: '654321',
          },
          {
            requestId: 'req-vmo-1',
            token: '789012',
          },
          {
            requestId: 'req-veo-1',
            token: '210987',
          },
          {
            requestId: 'req-vel-1',
            token: 'link-token-123',
          },
        ],
      };

      const multiResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1111111111',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-mo-1',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user1@example.com',
            serviceType: ServiceType.AUTH_EO,
            requestId: 'req-eo-1',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: '+2222222222',
            serviceType: ServiceType.VERIFY_MO,
            requestId: 'req-vmo-1',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user2@example.com',
            serviceType: ServiceType.VERIFY_EO,
            requestId: 'req-veo-1',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user3@example.com',
            serviceType: ServiceType.VERIFY_EL,
            requestId: 'req-vel-1',
            verificationStatus: 'SUCCESS',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-multi',
          text: 'Multiple tokens verified successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(multiResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, multiRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[1].serviceType).toBe(ServiceType.AUTH_EO);
      expect(result.data[2].serviceType).toBe(ServiceType.VERIFY_MO);
      expect(result.data[3].serviceType).toBe(ServiceType.VERIFY_EO);
      expect(result.data[4].serviceType).toBe(ServiceType.VERIFY_EL);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, multiRequest);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const differentResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+9999999999',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-diff-123',
            verificationStatus: 'SUCCESS',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-diff',
          text: 'Token verified for different app',
        },
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.data[0].userIdentity).toBe('+9999999999');
      expect(result.responseMessages.text).toBe('Token verified for different app');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle failed verification status', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const failedResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-failed-123',
            verificationStatus: 'FAILED',
          },
        ],
        responseMessages: {
          type: 'E',
          id: 'msg-failed',
          text: 'Token verification failed',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'E',
            text: 'Verification failed',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(failedResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].verificationStatus).toBe('FAILED');
      expect(result.responseMessages.type).toBe('E');
      expect(result.messages.resourceMessages.type).toBe('E');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle mixed verification results', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const mixedResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-success-123',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user@example.com',
            serviceType: ServiceType.VERIFY_EO,
            requestId: 'req-failed-456',
            verificationStatus: 'FAILED',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-mixed',
          text: 'Mixed verification results',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning',
              text: 'One verification failed',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed with mixed results',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(mixedResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].verificationStatus).toBe('SUCCESS');
      expect(result.data[1].verificationStatus).toBe('FAILED');
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle empty request data', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const emptyRequest: VerificationMainRequestDto = {
        data: [],
      };

      const emptyResponse: VerificationMainResponseDto = {
        data: [],
        responseMessages: {
          type: 'S',
          id: 'msg-empty',
          text: 'No tokens to verify',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, emptyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.responseMessages.text).toBe('No tokens to verify');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, emptyRequest);
    });

    it('should handle field messages in response', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const fieldMessageResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-field-123',
            verificationStatus: 'SUCCESS',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-field',
          text: 'Verification completed with warnings',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning',
              text: 'Token was close to expiry',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(fieldMessageResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[0].text).toBe('Token was close to expiry');
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle different token formats', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const differentFormatsRequest: VerificationMainRequestDto = {
        data: [
          {
            requestId: 'req-numeric-123',
            token: '123456', // Numeric token
          },
          {
            requestId: 'req-alphanumeric-456',
            token: 'ABC123', // Alphanumeric token
          },
          {
            requestId: 'req-link-789',
            token: 'link-token-very-long-string-123', // Link token
          },
        ],
      };

      const differentFormatsResponse: VerificationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-numeric-123',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user@example.com',
            serviceType: ServiceType.VERIFY_EO,
            requestId: 'req-alphanumeric-456',
            verificationStatus: 'SUCCESS',
          },
          {
            userIdentity: 'user@example.com',
            serviceType: ServiceType.VERIFY_EL,
            requestId: 'req-link-789',
            verificationStatus: 'SUCCESS',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-formats',
          text: 'Different token formats verified successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification completed successfully',
          },
        },
      };

      mockVerificationService.verifyTokens.mockResolvedValue(differentFormatsResponse);

      // Act
      const result = await controller.verifyTokens(applicationCode, differentFormatsRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[1].serviceType).toBe(ServiceType.VERIFY_EO);
      expect(result.data[2].serviceType).toBe(ServiceType.VERIFY_EL);
      expect(mockVerificationService.verifyTokens).toHaveBeenCalledWith(applicationCode, differentFormatsRequest);
    });
  });
}); 