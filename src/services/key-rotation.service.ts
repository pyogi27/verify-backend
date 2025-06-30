import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOnboarding } from '../entities';
import { EncryptionService } from './encryption.service';
import { IdGenerator } from '../utils/id-generator.util';
import {
  KeyRotationResponseDto,
  ApplicationResponseDto,
  FieldMessageDto,
  MessagesDto,
  ResourceMessagesDto,
} from '../dto/key-rotation.dto';

@Injectable()
export class KeyRotationService {
  constructor(
    @InjectRepository(ApplicationOnboarding)
    private applicationRepository: Repository<ApplicationOnboarding>,
    private encryptionService: EncryptionService,
  ) {}

  async rotateKey(
    applicationCode: string,
    authenticatedApplicationId: string,
  ): Promise<KeyRotationResponseDto> {
    // Verify that the authenticated application matches the requested application
    if (applicationCode !== authenticatedApplicationId) {
      throw new ForbiddenException('Access denied to this application');
    }

    // Get the application
    const application = await this.applicationRepository.findOne({
      where: { application_id: applicationCode },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Generate new API key and secret
    const newApiKey = `app_${this.generateApiKey()}`;
    const newApiSecret = this.generateApiSecret();
    const newApiKeyExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    // Encrypt new credentials
    const encryptedApiKey = this.encryptionService.encryptApiKey(newApiKey);
    const encryptedApiSecret =
      this.encryptionService.encryptApiSecret(newApiSecret);

    // Update the application with new credentials
    application.api_key = encryptedApiKey;
    application.api_secret = encryptedApiSecret;
    application.api_key_expiry = new Date(newApiKeyExpiry * 1000);
    application.updated_at = new Date();

    await this.applicationRepository.save(application);

    // Prepare response data
    const responseData: ApplicationResponseDto[] = [
      {
        applicationName: application.application_name,
        applicationCode: application.application_id,
        applicationKey: newApiKey, // Return unencrypted key
        applicationKeySecret: newApiSecret, // Return unencrypted secret
        applicationKeyExpiry: newApiKeyExpiry,
      },
    ];

    // Prepare response messages
    const responseMessages: FieldMessageDto[] = [
      {
        type: 'S',
        id: IdGenerator.generateId(),
        text: 'API key rotated successfully',
      },
    ];

    // Prepare messages object
    const messages: MessagesDto = {
      resourceId: application.application_id,
      fieldMessages: [],
      resourceMessages: {
        type: 'S',
        text: 'Key rotation completed successfully',
      },
    };

    return {
      data: responseData,
      responseMessages,
      messages,
    };
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
