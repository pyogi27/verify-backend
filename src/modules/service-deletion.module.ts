import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceDeletionController } from '../controllers/service-deletion.controller';
import { ServiceDeletionService } from '../services/service-deletion.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { EncryptionService } from '../services/encryption.service';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationService, ApplicationOnboarding]),
  ],
  controllers: [ServiceDeletionController],
  providers: [
    ServiceDeletionService,
    ApplicationQueryService,
    EncryptionService,
  ],
  exports: [ServiceDeletionService],
})
export class ServiceDeletionModule {}
