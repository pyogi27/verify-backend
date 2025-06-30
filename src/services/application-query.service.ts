import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOnboarding } from '../entities';
import { EncryptionService } from './encryption.service';

@Injectable()
export class ApplicationQueryService {
  constructor(
    @InjectRepository(ApplicationOnboarding)
    private applicationRepository: Repository<ApplicationOnboarding>,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Get application by ID with decrypted API key and secret
   */
  async getApplicationById(applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { application_id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Decrypt the stored values
    const decryptedApiKey = this.encryptionService.decryptApiKey(
      application.api_key,
    );
    const decryptedApiSecret = this.encryptionService.decryptApiSecret(
      application.api_secret,
    );

    return {
      ...application,
      api_key: decryptedApiKey,
      api_secret: decryptedApiSecret,
    };
  }

  /**
   * Get application by name with decrypted API key and secret
   */
  async getApplicationByName(applicationName: string) {
    const application = await this.applicationRepository.findOne({
      where: { application_name: applicationName },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Decrypt the stored values
    const decryptedApiKey = this.encryptionService.decryptApiKey(
      application.api_key,
    );
    const decryptedApiSecret = this.encryptionService.decryptApiSecret(
      application.api_secret,
    );

    return {
      ...application,
      api_key: decryptedApiKey,
      api_secret: decryptedApiSecret,
    };
  }

  /**
   * Get application by API key (for authentication purposes)
   */
  async getApplicationByApiKey(apiKey: string) {
    // Get all applications and decrypt to find the matching one
    const applications = await this.applicationRepository.find({
      where: { is_active: true },
    });

    for (const application of applications) {
      try {
        const decryptedApiKey = this.encryptionService.decryptApiKey(
          application.api_key,
        );
        if (decryptedApiKey === apiKey) {
          const decryptedApiSecret = this.encryptionService.decryptApiSecret(
            application.api_secret,
          );
          return {
            ...application,
            api_key: decryptedApiKey,
            api_secret: decryptedApiSecret,
          };
        }
      } catch (error) {
        // Skip applications with decryption errors
        continue;
      }
    }

    throw new NotFoundException('Application not found');
  }
}
