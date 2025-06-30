import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationOnboarding,
  ApplicationService,
  ServiceType,
} from '../entities';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(ApplicationOnboarding)
    private applicationRepository: Repository<ApplicationOnboarding>,
    @InjectRepository(ApplicationService)
    private serviceRepository: Repository<ApplicationService>,
  ) {}

  async seed() {
    // Create a sample application
    const application = this.applicationRepository.create({
      application_name: 'Test Application',
      api_key: 'test-api-key-123',
      api_secret: 'test-api-secret-456',
      api_key_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      is_active: true,
    });

    const savedApplication = await this.applicationRepository.save(application);

    // Create sample services
    const services = [
      {
        application_id: savedApplication.application_id,
        service_type: ServiceType.AUTH_MO,
        verification_link_route: null,
        success_callback_config: {
          url: 'https://example.com/success',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        error_callback_config: {
          url: 'https://example.com/error',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        verification_config: {
          max_attempts: 3,
          code_length: 6,
          expiry_minutes: 10,
        },
        is_active: true,
      },
      {
        application_id: savedApplication.application_id,
        service_type: ServiceType.VERIFY_EO,
        verification_link_route: null,
        success_callback_config: {
          url: 'https://example.com/verify-success',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        error_callback_config: {
          url: 'https://example.com/verify-error',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        verification_config: {
          max_attempts: 5,
          code_length: 4,
          expiry_minutes: 15,
        },
        is_active: true,
      },
    ];

    for (const serviceData of services) {
      const service = this.serviceRepository.create(serviceData);
      await this.serviceRepository.save(service);
    }

    console.log('Database seeded successfully!');
    return { application: savedApplication, services };
  }
}
