import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ApplicationRegistrationService } from './application.service';
import { ApplicationOnboarding, ApplicationService } from '../entities';
import { EncryptionService } from './encryption.service';
import { ApplicationRegistrationRequestDto } from '../dto/application-registration.dto';
import { ServiceType } from '../entities/service-type.enum';

describe('ApplicationRegistrationService', () => {
  let service: ApplicationRegistrationService;
  let applicationRepository: Repository<ApplicationOnboarding>;
  let serviceRepository: Repository<ApplicationService>;
  let encryptionService: EncryptionService;

  const mockApplicationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockServiceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEncryptionService = {
    encryptApiKey: jest.fn(),
    encryptApiSecret: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationRegistrationService,
        {
          provide: getRepositoryToken(ApplicationOnboarding),
          useValue: mockApplicationRepository,
        },
        {
          provide: getRepositoryToken(ApplicationService),
          useValue: mockServiceRepository,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<ApplicationRegistrationService>(ApplicationRegistrationService);
    applicationRepository = module.get<Repository<ApplicationOnboarding>>(
      getRepositoryToken(ApplicationOnboarding),
    );
    serviceRepository = module.get<Repository<ApplicationService>>(
      getRepositoryToken(ApplicationService),
    );
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerApplications', () => {
    const mockRequest: ApplicationRegistrationRequestDto = {
      data: [
        {
          applicationName: 'TestApp',
          services: [
            {
              serviceType: ServiceType.AUTH_MO,
              verificationConfig: {
                maxResendCount: 3,
                maxAttemptCount: 3,
                tokenLength: 6,
                tokenPattern: 'numeric',
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

    const mockSavedApplication = {
      application_id: 'test-uuid',
      application_name: 'TestApp',
      api_key: 'encrypted-api-key',
      api_secret: 'encrypted-api-secret',
      api_key_expiry: new Date(),
      is_active: true,
    };

    it('should successfully register an application', async () => {
      // Arrange
      mockApplicationRepository.findOne.mockResolvedValue(null);
      mockApplicationRepository.create.mockReturnValue(mockSavedApplication);
      mockApplicationRepository.save.mockResolvedValue(mockSavedApplication);
      mockServiceRepository.findOne.mockResolvedValue(null);
      mockServiceRepository.create.mockReturnValue({});
      mockServiceRepository.save.mockResolvedValue({});
      mockEncryptionService.encryptApiKey.mockReturnValue('encrypted-api-key');
      mockEncryptionService.encryptApiSecret.mockReturnValue('encrypted-api-secret');

      // Act
      const result = await service.registerApplications(mockRequest);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].applicationName).toBe('TestApp');
      expect(result.data[0].applicationCode).toBe('test-uuid');
      expect(result.data[0].applicationKey).toMatch(/^app_/);
      expect(result.data[0].applicationKeySecret).toContain('-');
      expect(result.data[0].servicesSubscribed).toContain(ServiceType.AUTH_MO);
      expect(result.responseMessages).toHaveLength(1);
      expect(result.responseMessages[0].type).toBe('S');
      expect(result.responseMessages[0].text).toBe('Application registered successfully');
    });

    it('should throw ConflictException when application name already exists', async () => {
      // Arrange
      mockApplicationRepository.findOne.mockResolvedValue({ application_id: 'existing' });

      // Act & Assert
      await expect(service.registerApplications(mockRequest)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when service already exists', async () => {
      // Arrange
      mockApplicationRepository.findOne.mockResolvedValue(null);
      mockApplicationRepository.create.mockReturnValue(mockSavedApplication);
      mockApplicationRepository.save.mockResolvedValue(mockSavedApplication);
      mockServiceRepository.findOne.mockResolvedValue({ service_id: 'existing' });

      // Act & Assert
      await expect(service.registerApplications(mockRequest)).rejects.toThrow(ConflictException);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockApplicationRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.registerApplications(mockRequest)).rejects.toThrow(InternalServerErrorException);
    });
  });
}); 