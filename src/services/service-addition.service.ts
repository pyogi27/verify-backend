import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOnboarding, ApplicationService } from '../entities';
import { IdGenerator } from '../utils/id-generator.util';
import {
  ServiceAdditionRequestDto,
  ServiceAdditionMainResponseDto,
  ServiceAdditionResponseDto,
  ResponseMessageDto,
  MessagesDto,
  ResourceMessagesDto,
} from '../dto/service-addition.dto';

@Injectable()
export class ServiceAdditionService {
  constructor(
    @InjectRepository(ApplicationOnboarding)
    private applicationRepository: Repository<ApplicationOnboarding>,
    @InjectRepository(ApplicationService)
    private serviceRepository: Repository<ApplicationService>,
  ) {}

  async addServices(
    applicationCode: string,
    request: ServiceAdditionRequestDto,
  ): Promise<ServiceAdditionMainResponseDto> {
    // Get the application
    const application = await this.applicationRepository.findOne({
      where: { application_id: applicationCode },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if application is active
    if (!application.is_active) {
      throw new ConflictException('Application is inactive');
    }

    const servicesSubscribed: string[] = [];

    // Process each service
    for (const serviceData of request.services) {
      // Check if service already exists for this application
      const existingService = await this.serviceRepository.findOne({
        where: {
          application_id: applicationCode,
          service_type: serviceData.serviceType,
        },
      });

      if (existingService) {
        throw new ConflictException(
          `Service ${serviceData.serviceType} already subscribed`,
        );
      }

      // Create new service
      const service = this.serviceRepository.create({
        application_id: applicationCode,
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

    // Prepare response data
    const responseData: ServiceAdditionResponseDto[] = [
      {
        servicesSubscribed,
      },
    ];

    // Prepare response messages
    const responseMessages: ResponseMessageDto[] = [
      {
        type: 'S',
        id: IdGenerator.generateId(),
        text: 'Services added successfully',
      },
    ];

    // Prepare messages object
    const messages: MessagesDto = {
      resourceId: applicationCode,
      fieldMessages: [],
      resourceMessages: {
        type: 'S',
        text: 'Service addition completed successfully',
      },
    };

    return {
      data: responseData,
      responseMessages,
      messages,
    };
  }
}
