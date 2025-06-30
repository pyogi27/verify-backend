import { Test, TestingModule } from '@nestjs/testing';
import { ServiceDeletionController } from './service-deletion.controller';
import { ServiceDeletionService } from '../services/service-deletion.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import { ServiceDeletionMainResponseDto } from '../dto/service-deletion.dto';
import { ServiceType } from '../entities/service-type.enum';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('ServiceDeletionController', () => {
  let controller: ServiceDeletionController;
  let serviceDeletionService: ServiceDeletionService;

  const mockServiceDeletionService = {
    deleteService: jest.fn(),
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
      controllers: [ServiceDeletionController],
      providers: [
        { provide: ServiceDeletionService, useValue: mockServiceDeletionService },
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

    controller = module.get<ServiceDeletionController>(ServiceDeletionController);
    serviceDeletionService = module.get<ServiceDeletionService>(ServiceDeletionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteService', () => {
    const mockResponse: ServiceDeletionMainResponseDto = {
      data: 'Service deleted successfully',
      responseMessages: [
        {
          type: 'S',
          id: 'msg-123',
          text: 'Service deleted successfully',
        },
      ],
      messages: {
        resourceId: 'test-app-id',
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Service deletion completed successfully',
        },
      },
    };

    const mockAuthenticatedApp = {
      application_id: 'test-app-id',
      application_name: 'TestApp',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    it('should delete service successfully', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_MO;
      mockServiceDeletionService.deleteService.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result).toBe(mockResponse);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
      expect(result.data).toBe('Service deleted successfully');
      expect(result.responseMessages[0].type).toBe('S');
      expect(result.messages.resourceId).toBe(applicationCode);
    });

    it('should handle application not found', async () => {
      // Arrange
      const applicationCode = 'non-existent-app';
      const serviceType = ServiceType.AUTH_EO;
      const notFoundError = new NotFoundException('Application not found');
      mockServiceDeletionService.deleteService.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle service not found', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_MO;
      const notFoundError = new NotFoundException('Service not found for this application');
      mockServiceDeletionService.deleteService.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp)).rejects.toThrow(NotFoundException);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle inactive application', async () => {
      // Arrange
      const applicationCode = 'inactive-app';
      const serviceType = ServiceType.VERIFY_EO;
      const forbiddenError = new Error('Application is inactive');
      mockServiceDeletionService.deleteService.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle database errors', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_MO;
      const dbError = new InternalServerErrorException('Database connection failed');
      mockServiceDeletionService.deleteService.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp)).rejects.toThrow(InternalServerErrorException);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle service with active verification requests', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EL;
      const conflictError = new Error('Cannot delete service with active verification requests');
      mockServiceDeletionService.deleteService.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp)).rejects.toThrow(Error);
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle different application codes', async () => {
      // Arrange
      const applicationCode = 'different-app-code';
      const serviceType = ServiceType.AUTH_EO;
      const differentResponse: ServiceDeletionMainResponseDto = {
        data: 'Service deleted from different app',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-diff',
            text: 'Service deleted from different app',
          },
        ],
        messages: {
          resourceId: 'different-app-code',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(differentResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.messages.resourceId).toBe(applicationCode);
      expect(result.data).toBe('Service deleted from different app');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle all service types', async () => {
      // Test all service types
      const serviceTypes = [ServiceType.AUTH_MO, ServiceType.AUTH_EO, ServiceType.VERIFY_MO, ServiceType.VERIFY_EO, ServiceType.VERIFY_EL];
      
      for (const serviceType of serviceTypes) {
        // Arrange
        const applicationCode = 'test-app-id';
        const serviceSpecificResponse: ServiceDeletionMainResponseDto = {
          data: `${serviceType} service deleted successfully`,
          responseMessages: [
            {
              type: 'S',
              id: `msg-${serviceType}`,
              text: `${serviceType} service deleted successfully`,
            },
          ],
          messages: {
            resourceId: 'test-app-id',
            fieldMessages: [],
            resourceMessages: {
              type: 'S',
              text: 'Service deletion completed successfully',
            },
          },
        };

        mockServiceDeletionService.deleteService.mockResolvedValue(serviceSpecificResponse);

        // Act
        const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

        // Assert
        expect(result.data).toBe(`${serviceType} service deleted successfully`);
        expect(result.responseMessages[0].text).toBe(`${serviceType} service deleted successfully`);
        expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
      }
    });

    it('should handle deletion with null response data', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_MO;
      const nullResponse: ServiceDeletionMainResponseDto = {
        data: null,
        responseMessages: [
          {
            type: 'S',
            id: 'msg-null',
            text: 'Service deleted successfully',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(nullResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.data).toBeNull();
      expect(result.responseMessages[0].type).toBe('S');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle deletion with empty string response data', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_EO;
      const emptyResponse: ServiceDeletionMainResponseDto = {
        data: '',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-empty',
            text: 'Service deleted successfully',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.data).toBe('');
      expect(result.responseMessages[0].type).toBe('S');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle deletion with field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EL;
      const fieldMessageResponse: ServiceDeletionMainResponseDto = {
        data: 'Service deleted with warnings',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-warning',
            text: 'Service deleted with warnings',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning',
              text: 'Some verification requests were cancelled',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(fieldMessageResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[0].text).toBe('Some verification requests were cancelled');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle deletion with multiple field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.AUTH_MO;
      const multiFieldResponse: ServiceDeletionMainResponseDto = {
        data: 'Service deleted with multiple warnings',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-multi',
            text: 'Service deleted with multiple warnings',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'W',
              id: 'field-warning-1',
              text: 'Active verification requests were cancelled',
            },
            {
              type: 'W',
              id: 'field-warning-2',
              text: 'Service configuration was removed',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(multiFieldResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(2);
      expect(result.messages.fieldMessages[0].type).toBe('W');
      expect(result.messages.fieldMessages[1].type).toBe('W');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle deletion with error field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_EO;
      const errorFieldResponse: ServiceDeletionMainResponseDto = {
        data: 'Service deletion completed with errors',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-error',
            text: 'Service deletion completed with errors',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'E',
              id: 'field-error',
              text: 'Failed to clean up some verification data',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(errorFieldResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('E');
      expect(result.messages.fieldMessages[0].text).toBe('Failed to clean up some verification data');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });

    it('should handle deletion with success field messages', async () => {
      // Arrange
      const applicationCode = 'test-app-id';
      const serviceType = ServiceType.VERIFY_MO;
      const successFieldResponse: ServiceDeletionMainResponseDto = {
        data: 'Service deleted successfully with cleanup',
        responseMessages: [
          {
            type: 'S',
            id: 'msg-success',
            text: 'Service deleted successfully with cleanup',
          },
        ],
        messages: {
          resourceId: 'test-app-id',
          fieldMessages: [
            {
              type: 'S',
              id: 'field-success',
              text: 'All verification data cleaned up successfully',
            },
          ],
          resourceMessages: {
            type: 'S',
            text: 'Service deletion completed successfully',
          },
        },
      };

      mockServiceDeletionService.deleteService.mockResolvedValue(successFieldResponse);

      // Act
      const result = await controller.deleteService(applicationCode, serviceType, mockAuthenticatedApp);

      // Assert
      expect(result.messages.fieldMessages).toHaveLength(1);
      expect(result.messages.fieldMessages[0].type).toBe('S');
      expect(result.messages.fieldMessages[0].text).toBe('All verification data cleaned up successfully');
      expect(mockServiceDeletionService.deleteService).toHaveBeenCalledWith(applicationCode, serviceType);
    });
  });
}); 