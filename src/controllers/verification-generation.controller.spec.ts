import { Test, TestingModule } from '@nestjs/testing';
import { VerificationGenerationController } from './verification-generation.controller';
import { VerificationGenerationService } from '../services/verification-generation.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { VerificationGenerationMainRequestDto, VerificationGenerationMainResponseDto } from '../dto/verification-generation.dto';
import { ServiceType } from '../entities/service-type.enum';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('VerificationGenerationController', () => {
  let controller: VerificationGenerationController;
  let verificationGenerationService: VerificationGenerationService;

  const mockVerificationGenerationService = {
    generateVerification: jest.fn(),
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
      controllers: [VerificationGenerationController],
      providers: [
        { provide: VerificationGenerationService, useValue: mockVerificationGenerationService },
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

    controller = module.get<VerificationGenerationController>(VerificationGenerationController);
    verificationGenerationService = module.get<VerificationGenerationService>(VerificationGenerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVerification', () => {
    const mockRequest: VerificationGenerationMainRequestDto = {
      data: [
        {
          serviceType: ServiceType.AUTH_MO,
          userIdentity: '+1234567890',
        },
        {
          serviceType: ServiceType.VERIFY_EO,
          userIdentity: 'user@example.com',
        },
      ],
    };

    const mockResponse: VerificationGenerationMainResponseDto = {
      data: [
        {
          userIdentity: '+1234567890',
          serviceType: ServiceType.AUTH_MO,
          requestId: 'req-123-456-789',
          token: '123456',
        },
        {
          userIdentity: 'user@example.com',
          serviceType: ServiceType.VERIFY_EO,
          requestId: 'req-987-654-321',
          token: '789012',
        },
      ],
      responseMessages: {
        type: 'S',
        id: 'msg-123',
        text: 'Verification requests generated successfully',
      },
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Verification generation completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should generate verification requests successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      mockVerificationGenerationService.generateVerification.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].userIdentity).toBe('+1234567890');
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[0].requestId).toBe('req-123-456-789');
      expect(result.data[0].token).toBe('123456');
      expect(result.responseMessages.type).toBe('S');
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const notFoundError = new NotFoundException('Application not found');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle service not found', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const notFoundError = new NotFoundException('Service not found for this application');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const forbiddenError = new Error('Application is inactive');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle active verification request conflict', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const conflictError = new ConflictException('Active verification request already exists for this user');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(ConflictException);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const validationError = new Error('Invalid user identity format');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const dbError = new InternalServerErrorException('Database connection failed');
      mockVerificationGenerationService.generateVerification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle single verification request', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const singleRequest: VerificationGenerationMainRequestDto = {
        data: [
          {
            serviceType: ServiceType.VERIFY_EL,
            userIdentity: 'user@example.com',
          },
        ],
      };

      const singleResponse: VerificationGenerationMainResponseDto = {
        data: [
          {
            userIdentity: 'user@example.com',
            serviceType: ServiceType.VERIFY_EL,
            requestId: 'req-single-123',
            token: 'link-token-456',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-single',
          text: 'Single verification request generated successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(singleResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, singleRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].serviceType).toBe(ServiceType.VERIFY_EL);
      expect(result.data[0].userIdentity).toBe('user@example.com');
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, singleRequest);
    });

    it('should handle multiple verification requests', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const multiRequest: VerificationGenerationMainRequestDto = {
        data: [
          {
            serviceType: ServiceType.AUTH_MO,
            userIdentity: '+1111111111',
          },
          {
            serviceType: ServiceType.AUTH_EO,
            userIdentity: 'user1@example.com',
          },
          {
            serviceType: ServiceType.VERIFY_MO,
            userIdentity: '+2222222222',
          },
          {
            serviceType: ServiceType.VERIFY_EO,
            userIdentity: 'user2@example.com',
          },
          {
            serviceType: ServiceType.VERIFY_EL,
            userIdentity: 'user3@example.com',
          },
        ],
      };

      const multiResponse: VerificationGenerationMainResponseDto = {
        data: [
          {
            userIdentity: '+1111111111',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-mo-1',
            token: '123456',
          },
          {
            userIdentity: 'user1@example.com',
            serviceType: ServiceType.AUTH_EO,
            requestId: 'req-eo-1',
            token: '654321',
          },
          {
            userIdentity: '+2222222222',
            serviceType: ServiceType.VERIFY_MO,
            requestId: 'req-vmo-1',
            token: '789012',
          },
          {
            userIdentity: 'user2@example.com',
            serviceType: ServiceType.VERIFY_EO,
            requestId: 'req-veo-1',
            token: '210987',
          },
          {
            userIdentity: 'user3@example.com',
            serviceType: ServiceType.VERIFY_EL,
            requestId: 'req-vel-1',
            token: 'link-token-123',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-multi',
          text: 'Multiple verification requests generated successfully',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(multiResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, multiRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.data[0].serviceType).toBe(ServiceType.AUTH_MO);
      expect(result.data[1].serviceType).toBe(ServiceType.AUTH_EO);
      expect(result.data[2].serviceType).toBe(ServiceType.VERIFY_MO);
      expect(result.data[3].serviceType).toBe(ServiceType.VERIFY_EO);
      expect(result.data[4].serviceType).toBe(ServiceType.VERIFY_EL);
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, multiRequest);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const differentResponse: VerificationGenerationMainResponseDto = {
        data: [
          {
            userIdentity: '+9999999999',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-diff-123',
            token: 'diff-token',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-diff',
          text: 'Verification generated for different app',
        },
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.data[0].userIdentity).toBe('+9999999999');
      expect(result.responseMessages.text).toBe('Verification generated for different app');
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle all service types', async () => {
      // Test all service types
      const serviceTypes = [ServiceType.AUTH_MO, ServiceType.AUTH_EO, ServiceType.VERIFY_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL];
      
      for (const serviceType of serviceTypes) {
        // Arrange
        const applicationCode = 'test-app-id';
        const serviceSpecificRequest: VerificationGenerationMainRequestDto = {
          data: [
            {
              serviceType,
              userIdentity: serviceType.includes('MO') ? '+1234567890' : 'user@example.com',
            },
          ],
        };

        const serviceSpecificResponse: VerificationGenerationMainResponseDto = {
          data: [
            {
              userIdentity: serviceType.includes('MO') ? '+1234567890' : 'user@example.com',
              serviceType,
              requestId: `req-${serviceType}-123`,
              token: serviceType === ServiceType.VERIFY_EL ? 'link-token' : '123456',
            },
          ],
          responseMessages: {
            type: 'S',
            id: `msg-${serviceType}`,
            text: `${serviceType} verification generated successfully`,
          },
          messages: {
            resourceId: 'test-app-id',
            fieldMessages: [],
            resourceMessages: {
              type: 'S',
              text: 'Verification generation completed successfully',
            },
          },
        };

        mockVerificationGenerationService.generateVerification.mockResolvedValue(serviceSpecificResponse);

        // Act
        const result = await controller.generateVerification(applicationCode, serviceSpecificRequest, mockAuthenticatedApp);

        // Assert
        expect(result.data[0].serviceType).toBe(serviceType);
        expect(result.responseMessages.text).toBe(`${serviceType} verification generated successfully`);
        expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, serviceSpecificRequest);
      }
    });

    it('should handle empty request data', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const emptyRequest: VerificationGenerationMainRequestDto = {
        data: [],
      };

      const emptyResponse: VerificationGenerationMainResponseDto = {
        data: [],
        responseMessages: {
          type: 'S',
          id: 'msg-empty',
          text: 'No verification requests to generate',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, emptyRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.responseMessages.text).toBe('No verification requests to generate');
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, emptyRequest);
    });

    it('should handle field messages in response', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const fieldMessageResponse: VerificationGenerationMainResponseDto = {
        data: [
          {
            userIdentity: '+1234567890',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-field-123',
            token: '123456',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-field',
          text: 'Verification generated with warnings',
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
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(fieldMessageResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, mockRequest, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[0].text).toBe('User has multiple active requests');
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, mockRequest);
    });

    it('should handle different user identity formats', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const differentFormatsRequest: VerificationGenerationMainRequestDto = {
        data: [
          {
            serviceType: ServiceType.AUTH_MO,
            userIdentity: '+1-234-567-8900', // Different phone format
          },
          {
            serviceType: ServiceType.AUTH_EO,
            userIdentity: 'USER@EXAMPLE.COM', // Different email format
          },
        ],
      };

      const differentFormatsResponse: VerificationGenerationMainResponseDto = {
        data: [
          {
            userIdentity: '+1-234-567-8900',
            serviceType: ServiceType.AUTH_MO,
            requestId: 'req-format-1',
            token: '123456',
          },
          {
            userIdentity: 'USER@EXAMPLE.COM',
            serviceType: ServiceType.AUTH_EO,
            requestId: 'req-format-2',
            token: '654321',
          },
        ],
        responseMessages: {
          type: 'S',
          id: 'msg-format',
          text: 'Verification generated with different formats',
        },
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Verification generation completed successfully',
          },
        },
      };

      mockVerificationGenerationService.generateVerification.mockResolvedValue(differentFormatsResponse);

      // Act
      const result = await controller.generateVerification(applicationCode, differentFormatsRequest, mockAuthenticatedApp);

      // Assert
      expect(result.data[0].userIdentity).toBe('+1-234-567-8900');
      expect(result.data[1].userIdentity).toBe('USER@EXAMPLE.COM');
      expect(mockVerificationGenerationService.generateVerification).toHaveBeenCalledWith(applicationCode, differentFormatsRequest);
    });
  });
}); 