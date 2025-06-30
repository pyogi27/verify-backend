import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationController } from '../controllers/application.controller';
import { ApplicationRegistrationService } from '../services/application.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { KeyRotationService } from '../services/key-rotation.service';
import { EncryptionService } from '../services/encryption.service';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { ApplicationOnboarding, ApplicationService } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationOnboarding, ApplicationService]),
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationRegistrationService,
    ApplicationQueryService,
    KeyRotationService,
    EncryptionService,
    ApiAuthGuard,
  ],
  exports: [ApplicationRegistrationService, ApplicationQueryService],
})
export class ApplicationModule {}
