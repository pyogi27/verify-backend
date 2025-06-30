import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { AuthVerificationRequest } from '../entities/auth-verification-requests.entity';
import {
  VerificationGenerationMainRequestDto,
  VerificationGenerationMainResponseDto,
  VerificationGenerationResponseDto,
  ResponseMessageDto,
  MessagesDto,
} from '../dto/verification-generation.dto';
import { IdGenerator } from '../utils/id-generator.util';
import { EncryptionService } from './encryption.service';

interface VerificationConfig {
  tokenLength?: number;
  tokenPattern?: string;
  expiryTime?: number;
  maxAttemptCount?: number;
  maxResendCount?: number;
}

@Injectable()
export class VerificationGenerationService {
  constructor(
    @InjectRepository(ApplicationService)
    private applicationServicesRepository: Repository<ApplicationService>,
    @InjectRepository(ApplicationOnboarding)
    private applicationOnboardingRepository: Repository<ApplicationOnboarding>,
    @InjectRepository(AuthVerificationRequest)
    private authVerificationRequestRepository: Repository<AuthVerificationRequest>,
    private encryptionService: EncryptionService,
  ) {}

  async generateVerification(
    applicationCode: string,
    request: VerificationGenerationMainRequestDto,
  ): Promise<VerificationGenerationMainResponseDto> {
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

    const responseData: VerificationGenerationResponseDto[] = [];

    // Process each verification request
    for (const verificationData of request.data) {
      // Find the service configuration
      const service = await this.applicationServicesRepository.findOne({
        where: {
          application_id: applicationCode,
          service_type: verificationData.serviceType,
          is_active: true,
        },
      });

      if (!service) {
        throw new NotFoundException(
          `Service ${verificationData.serviceType} not found or inactive for this application`,
        );
      }

      // Check if there's already an active verification request for this user and service
      const existingRequest =
        await this.authVerificationRequestRepository.findOne({
          where: {
            application_id: applicationCode,
            service_id: service.service_id,
            user_identity: verificationData.userIdentity,
            is_active: true,
            verified: false,
          },
        });

      if (existingRequest) {
        // Check if the existing request is still valid (not expired)
        if (new Date() < existingRequest.expiry_time) {
          throw new ConflictException(
            `Active verification request already exists for user ${verificationData.userIdentity}`,
          );
        } else {
          // Mark expired request as inactive
          existingRequest.is_active = false;
          await this.authVerificationRequestRepository.save(existingRequest);
        }
      }

      // Generate verification token based on service type
      const verificationConfig =
        service.verification_config as VerificationConfig;
      const token = this.generateToken(verificationConfig);
      const expiryTime = this.calculateExpiryTime(verificationConfig);

      // Encrypt the token before storing in database
      const encryptedToken = this.encryptionService.encrypt(token);

      // Create verification request
      const verificationRequest = this.authVerificationRequestRepository.create(
        {
          application_id: applicationCode,
          service_id: service.service_id,
          service_type: verificationData.serviceType,
          user_identity: verificationData.userIdentity,
          token: encryptedToken, // Store encrypted token
          expiry_time: expiryTime,
          attempt_count: 0,
          max_attempt_count: verificationConfig.maxAttemptCount || 3,
          resend_count: 0,
          max_resend_count: verificationConfig.maxResendCount || 3,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
          verified: false,
          verified_at: undefined, // Will be set when verified
          is_active: true,
        },
      );

      const savedRequest =
        await this.authVerificationRequestRepository.save(verificationRequest);

      // Add to response data with unencrypted token for the client
      responseData.push({
        userIdentity: verificationData.userIdentity,
        serviceType: verificationData.serviceType,
        requestId: savedRequest.request_id,
        token: token, // Return unencrypted token to client
      });
    }

    // Prepare response messages
    const responseMessages: ResponseMessageDto = {
      type: 'S',
      id: IdGenerator.generateId(),
      text: 'Verification requests generated successfully',
    };

    // Prepare messages object
    const messages: MessagesDto = {
      resourceId: applicationCode,
      fieldMessages: [],
      resourceMessages: {
        type: 'S',
        text: 'Verification generation completed successfully',
      },
    };

    return {
      data: responseData,
      responseMessages,
      messages,
    };
  }

  private generateToken(verificationConfig: VerificationConfig): string {
    const tokenLength = verificationConfig.tokenLength || 6;
    const tokenPattern = verificationConfig.tokenPattern || 'N';

    if (tokenPattern === 'N' || tokenPattern === 'numeric') {
      // Generate numeric token
      return Math.random()
        .toString()
        .substring(2, 2 + tokenLength)
        .padStart(tokenLength, '0');
    } else if (tokenPattern === 'A' || tokenPattern === 'alphanumeric') {
      // Generate alphanumeric token
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < tokenLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    } else {
      // Default to numeric
      return Math.random()
        .toString()
        .substring(2, 2 + tokenLength)
        .padStart(tokenLength, '0');
    }
  }

  private calculateExpiryTime(verificationConfig: VerificationConfig): Date {
    const expiryTimeSeconds = verificationConfig.expiryTime || 300; // Default 5 minutes
    return new Date(Date.now() + expiryTimeSeconds * 1000);
  }
}
