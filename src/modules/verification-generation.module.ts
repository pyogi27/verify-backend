import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationGenerationController } from '../controllers/verification-generation.controller';
import { VerificationGenerationService } from '../services/verification-generation.service';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { AuthVerificationRequest } from '../entities/auth-verification-requests.entity';
import { ApplicationModule } from './application.module';
import { EncryptionService } from '../services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationService,
      ApplicationOnboarding,
      AuthVerificationRequest,
    ]),
    ApplicationModule,
  ],
  controllers: [VerificationGenerationController],
  providers: [VerificationGenerationService, EncryptionService],
  exports: [VerificationGenerationService],
})
export class VerificationGenerationModule {}
