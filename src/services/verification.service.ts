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
import {
  VerificationMainRequestDto,
  VerificationMainResponseDto,
  ResponseMessageDto,
  MessagesDto,
} from '../dto/verification.dto';
import { IdGenerator } from '../utils/id-generator.util';
import { EncryptionService } from './encryption.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(AuthVerificationRequest)
    private authVerificationRequestRepository: Repository<AuthVerificationRequest>,
    @InjectRepository(ApplicationOnboarding)
    private applicationOnboardingRepository: Repository<ApplicationOnboarding>,
    private encryptionService: EncryptionService,
  ) {}

  async verifyTokens(
    applicationCode: string,
    request: VerificationMainRequestDto,
  ): Promise<VerificationMainResponseDto> {
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

    // Process each verification request
    for (const verificationData of request.data) {
      // Find the verification request
      const verificationRequest =
        await this.authVerificationRequestRepository.findOne({
          where: {
            request_id: verificationData.requestId,
            application_id: applicationCode,
            is_active: true,
          },
        });

      if (!verificationRequest) {
        throw new NotFoundException(
          `Verification request not found: ${verificationData.requestId}`,
        );
      }

      // Check if already verified
      if (verificationRequest.verified) {
        throw new ConflictException(
          `Verification request already verified: ${verificationData.requestId}`,
        );
      }

      // Check if expired
      if (new Date() > verificationRequest.expiry_time) {
        throw new BadRequestException(
          `Verification request expired: ${verificationData.requestId}`,
        );
      }

      // Check attempt count
      if (
        verificationRequest.attempt_count >=
        verificationRequest.max_attempt_count
      ) {
        throw new BadRequestException(
          `Maximum verification attempts exceeded: ${verificationData.requestId}`,
        );
      }

      // Decrypt the stored token
      let storedToken: string;
      try {
        storedToken = this.encryptionService.decrypt(verificationRequest.token);
      } catch (error) {
        throw new BadRequestException(
          `Failed to decrypt stored token: ${verificationData.requestId}`,
        );
      }

      // Compare tokens
      if (storedToken !== verificationData.token) {
        // Increment attempt count
        verificationRequest.attempt_count += 1;
        await this.authVerificationRequestRepository.save(verificationRequest);

        throw new BadRequestException(
          `Invalid token provided: ${verificationData.requestId}`,
        );
      }

      // Mark as verified
      verificationRequest.verified = true;
      verificationRequest.verified_at = new Date();
      verificationRequest.is_active = false; // Deactivate after successful verification

      await this.authVerificationRequestRepository.save(verificationRequest);
    }

    // Prepare response messages
    const responseMessages: ResponseMessageDto = {
      type: 'S',
      id: IdGenerator.generateId(),
      text: 'Verification completed successfully',
    };

    // Prepare messages object
    const messages: MessagesDto = {
      resourceId: applicationCode,
      fieldMessages: [],
      resourceMessages: {
        type: 'S',
        text: 'Verification process completed successfully',
      },
    };

    return {
      data: [null], // As per specification: "Unknown Type: null"
      responseMessages,
      messages,
    };
  }
}
