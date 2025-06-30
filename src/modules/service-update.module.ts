import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceUpdateController } from '../controllers/service-update.controller';
import { ServiceUpdateService } from '../services/service-update.service';
import { ApplicationQueryService } from '../services/application-query.service';
import { EncryptionService } from '../services/encryption.service';
import { ApplicationService } from '../entities/application-services.entity';
import { ApplicationOnboarding } from '../entities/application-onboarding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationService, ApplicationOnboarding]),
  ],
  controllers: [ServiceUpdateController],
  providers: [ServiceUpdateService, ApplicationQueryService, EncryptionService],
  exports: [ServiceUpdateService],
})
export class ServiceUpdateModule {}
