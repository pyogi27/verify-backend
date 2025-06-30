import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from '../controllers/verification.controller';
import { VerificationService } from '../services/verification.service';
import { AuthVerificationRequest } from '../entities/auth-verification-requests.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';
import { ApplicationModule } from './application.module';
import { EncryptionService } from '../services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthVerificationRequest, ApplicationOnboarding]),
    ApplicationModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService, EncryptionService],
  exports: [VerificationService],
})
export class VerificationModule {}
