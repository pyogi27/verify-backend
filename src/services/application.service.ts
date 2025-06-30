import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOnboarding, ApplicationService } from '../entities';
import {
  ApplicationRegistrationRequestDto,
  ApplicationRegistrationResponseDto,
  ApplicationResponseDto,
  ResponseMessageDto,
} from '../dto/application-registration.dto';
import { IdGenerator } from '../utils/id-generator.util';
import { EncryptionService } from './encryption.service';

@Injectable()
export class ApplicationRegistrationService {
  constructor(
    @InjectRepository(ApplicationOnboarding)
    private applicationRepository: Repository<ApplicationOnboarding>,
    @InjectRepository(ApplicationService)
    private serviceRepository: Repository<ApplicationService>,
    private encryptionService: EncryptionService,
  ) {}

  async registerApplications(
    request: ApplicationRegistrationRequestDto,
  ): Promise<ApplicationRegistrationResponseDto> {
    const responseData: ApplicationResponseDto[] = [];
    const responseMessages: ResponseMessageDto[] = [];

    try {
      for (const applicationData of request.data) {
        // Check if application with same name already exists
        const existingApplication = await this.applicationRepository.findOne({
          where: { application_name: applicationData.applicationName },
        });

        if (existingApplication) {
          throw new ConflictException(
            'Application with this name already exists',
          );
        }

        // Generate API key and secret
        const apiKey = `app_${this.generateApiKey()}`;
        const apiSecret = this.generateApiSecret();
        const apiKeyExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

        // Encrypt API key and secret before storing
        const encryptedApiKey = this.encryptionService.encryptApiKey(apiKey);
        const encryptedApiSecret =
          this.encryptionService.encryptApiSecret(apiSecret);

        // Create application with encrypted data
        const application = this.applicationRepository.create({
          application_name: applicationData.applicationName,
          api_key: encryptedApiKey,
          api_secret: encryptedApiSecret,
          api_key_expiry: new Date(apiKeyExpiry * 1000),
          is_active: true,
        });

        const savedApplication =
          await this.applicationRepository.save(application);

        // Create services
        const servicesSubscribed: string[] = [];
        for (const serviceData of applicationData.services) {
          // Check if service already exists for this application
          const existingService = await this.serviceRepository.findOne({
            where: {
              application_id: savedApplication.application_id,
              service_type: serviceData.serviceType,
            },
          });

          if (existingService) {
            throw new ConflictException('Service already subscribed');
          }

          const service = this.serviceRepository.create({
            application_id: savedApplication.application_id,
            service_type: serviceData.serviceType,
            verification_link_route: serviceData.verificationLinkRoute || null,
            success_callback_config: serviceData.successCallback,
            error_callback_config: serviceData.errorCallback,
            verification_config: serviceData.verificationConfig,
            is_active: true,
          });

          await this.serviceRepository.save(service);
          servicesSubscribed.push(serviceData.serviceType);
        }

        // Create response data with decrypted values for the client
        responseData.push({
          applicationName: savedApplication.application_name,
          applicationCode: savedApplication.application_id,
          applicationKey: apiKey, // Return the original (unencrypted) key
          applicationKeySecret: apiSecret, // Return the original (unencrypted) secret
          applicationKeyExpiry: apiKeyExpiry,
          servicesSubscribed,
        });
      }

      // Add success message
      responseMessages.push({
        id: IdGenerator.generateId(),
        type: 'S',
        text: 'Application registered successfully',
      });

      return {
        data: responseData,
        responseMessages,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          data: [],
          responseMessages: [
            {
              id: IdGenerator.generateId(),
              type: 'E',
              text: error.message,
            },
          ],
        };
      }

      throw new InternalServerErrorException(
        'Unable to register application due to internal error',
      );
    }
  }

  private generateApiKey(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateApiSecret(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      '-' +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
