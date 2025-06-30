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
import { ServiceDeletionMainResponseDto } from '../dto/service-deletion.dto';
import { IdGenerator } from '../utils/id-generator.util';

@Injectable()
export class ServiceDeletionService {
  constructor(
    @InjectRepository(ApplicationService)
    private applicationServicesRepository: Repository<ApplicationService>,
    @InjectRepository(ApplicationOnboarding)
    private applicationOnboardingRepository: Repository<ApplicationOnboarding>,
  ) {}

  async deleteService(
    applicationCode: string,
    serviceType: ServiceType,
  ): Promise<ServiceDeletionMainResponseDto> {
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
      throw new BadRequestException(
        `Service ${serviceType} is already inactive`,
      );
    }

    // Soft delete the service by setting is_active to false
    existingService.is_active = false;
    existingService.updated_at = new Date();

    // Save the updated service
    await this.applicationServicesRepository.save(existingService);

    // Generate response
    const responseMessageId = IdGenerator.generateId();

    const response: ServiceDeletionMainResponseDto = {
      data: null, // As per the specification, data is "Unknown Type: null"
      responseMessages: [
        {
          type: 'S',
          id: responseMessageId,
          text: 'Service deleted successfully',
        },
      ],
      messages: {
        resourceId: applicationCode,
        fieldMessages: [],
        resourceMessages: {
          type: 'S',
          text: 'Service deletion completed successfully',
        },
      },
    };

    return response;
  }
}
