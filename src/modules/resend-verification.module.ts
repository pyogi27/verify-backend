import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResendVerificationController } from '../controllers/resend-verification.controller';
import { ResendVerificationService } from '../services/resend-verification.service';
import { AuthVerificationRequest } from '../entities/auth-verification-requests.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationModule } from './application.module';
import { EncryptionService } from '../services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthVerificationRequest,
      ApplicationOnboarding,
      ApplicationService,
    ]),
    ApplicationModule,
  ],
  controllers: [ResendVerificationController],
  providers: [ResendVerificationService, EncryptionService],
  exports: [ResendVerificationService],
})
export class ResendVerificationModule {}
