import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthVerificationRequest } from '../entities/auth-verification-requests.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { ApplicationService } from '../entities/application-services.entity';
import {
  ResendVerificationMainRequestDto,
  ResendVerificationMainResponseDto,
  ResendVerificationResponseDto,
  ResponseMessageDto,
  MessagesDto,
} from '../dto/resend-verification.dto';
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
export class ResendVerificationService {
  constructor(
    @InjectRepository(AuthVerificationRequest)
    private authVerificationRequestRepository: Repository<AuthVerificationRequest>,
    @InjectRepository(ApplicationOnboarding)
    private applicationOnboardingRepository: Repository<ApplicationOnboarding>,
    @InjectRepository(ApplicationService)
    private applicationServiceRepository: Repository<ApplicationService>,
    private encryptionService: EncryptionService,
  ) {}

  async resendVerification(
    applicationCode: string,
    request: ResendVerificationMainRequestDto,
  ): Promise<ResendVerificationMainResponseDto> {
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

    const responseData: ResendVerificationResponseDto[] = [];

    // Process each resend request
    for (const resendData of request.data) {
      // Find the verification request
      const verificationRequest =
        await this.authVerificationRequestRepository.findOne({
          where: {
            request_id: resendData.requestId,
            application_id: applicationCode,
            is_active: true,
          },
        });

      if (!verificationRequest) {
        throw new NotFoundException(
          `Verification request not found: ${resendData.requestId}`,
        );
      }

      // Check if already verified
      if (verificationRequest.verified) {
        throw new ConflictException(
          `Verification request already verified: ${resendData.requestId}`,
        );
      }

      // Check if expired
      if (new Date() > verificationRequest.expiry_time) {
        throw new BadRequestException(
          `Verification request expired: ${resendData.requestId}`,
        );
      }

      // Check resend count
      if (
        verificationRequest.resend_count >= verificationRequest.max_resend_count
      ) {
        throw new BadRequestException(
          `Maximum resend attempts exceeded: ${resendData.requestId}`,
        );
      }

      // Get the service configuration to regenerate token with same settings
      const service = await this.applicationServiceRepository.findOne({
        where: {
          service_id: verificationRequest.service_id,
          is_active: true,
        },
      });

      if (!service) {
        throw new NotFoundException(
          `Service configuration not found for request: ${resendData.requestId}`,
        );
      }

      // Generate new verification token based on service configuration
      const verificationConfig =
        service.verification_config as VerificationConfig;
      const newToken = this.generateToken(verificationConfig);
      const newExpiryTime = this.calculateExpiryTime(verificationConfig);

      // Encrypt the new token before storing in database
      const encryptedToken = this.encryptionService.encrypt(newToken);

      // Update the verification request with new token and expiry
      verificationRequest.token = encryptedToken;
      verificationRequest.expiry_time = newExpiryTime;
      verificationRequest.resend_count += 1;
      verificationRequest.updated_at = new Date();

      await this.authVerificationRequestRepository.save(verificationRequest);

      // Add to response data
      responseData.push({
        userIdentity: verificationRequest.user_identity,
        serviceType: verificationRequest.service_type,
        requestId: verificationRequest.request_id,
      });
    }

    // Prepare response messages
    const responseMessages: ResponseMessageDto = {
      type: 'S',
      id: IdGenerator.generateId(),
      text: 'Verification tokens resent successfully',
    };

    // Prepare messages object
    const messages: MessagesDto = {
      resourceId: applicationCode,
      fieldMessages: [],
      resourceMessages: {
        type: 'S',
        text: 'Resend verification completed successfully',
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
