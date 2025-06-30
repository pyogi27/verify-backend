import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { ServiceType } from '../entities/service-type.enum';
import {
  ServiceUpdateMainRequestDto,
  ServiceUpdateMainResponseDto,
} from '../dto/service-update.dto';
import { IdGenerator } from '../utils/id-generator.util';

@Injectable()
export class ServiceUpdateService {
  constructor(
    @InjectRepository(ApplicationService)
    private applicationServicesRepository: Repository<ApplicationService>,
    @InjectRepository(ApplicationOnboarding)
    private applicationOnboardingRepository: Repository<ApplicationOnboarding>,
  ) {}

  async updateService(
    applicationCode: string,
    serviceType: ServiceType,
    request: ServiceUpdateMainRequestDto,
  ): Promise<ServiceUpdateMainResponseDto> {
    // Validate application exists
    const application = await this.applicationOnboardingRepository.findOne({
      where: { application_id: applicationCode },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if application is active
    if (!application.is_active) {
      throw new BadRequestException('Application is inactive');
    }

    // Find the existing service
    const existingService = await this.applicationServicesRepository.findOne({
      where: {
        application_id: applicationCode,
        service_type: serviceType,
      },
    });

    if (!existingService) {
      throw new NotFoundException(
        `Service ${serviceType} not found for this application`,
      );
    }

    // Check if service is active
    if (!existingService.is_active) {
      throw new BadRequestException(`Service ${serviceType} is inactive`);
    }

    // Update the service with new configuration
    const updateData = request.data[0]; // Take the first item from the data array

    // Update verification link route if provided
    if (updateData.verificationLinkRoute) {
      existingService.verification_link_route =
        updateData.verificationLinkRoute;
    }

    // Update verification config
    existingService.verification_config = {
      maxResendCount: updateData.verificationConfig.maxResendCount,
      maxAttemptCount: updateData.verificationConfig.maxAttemptCount,
      tokenLength: updateData.verificationConfig.tokenLength,
      tokenPattern: updateData.verificationConfig.tokenPattern,
      expiryTime: updateData.verificationConfig.expiryTime,
    };

    // Update success callback config
    existingService.success_callback_config = {
      callbackUrl: updateData.successCallback.callbackUrl,
      callbackMethod: updateData.successCallback.callbackMethod,
      payload: updateData.successCallback.payload,
    };

    // Update error callback config
    existingService.error_callback_config = {
      callbackUrl: updateData.errorCallback.callbackUrl,
      callbackMethod: updateData.errorCallback.callbackMethod,
      payload: updateData.errorCallback.payload,
    };

    // Update timestamp
    existingService.updated_at = new Date();

    // Save the updated service
    await this.applicationServicesRepository.save(existingService);

    // Generate response
    const responseMessageId = IdGenerator.generateId();

    const response: ServiceUpdateMainResponseDto = {
      data: [null], // As per the specification, data contains "Unknown Type: null"
      responseMessages: {
        type: 'S',
        id: responseMessageId,
        text: 'Service updated successfully',
      },
      messages: {
        resourceId: applicationCode,
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Service update completed successfully',
        },
      },
    };

    return response;
  }
}
