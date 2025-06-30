import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAdditionController } from '../controllers/service-addition.controller';
import { ServiceAdditionService } from '../services/service-addition.service';
import { ApplicationOnboarding, ApplicationService } from '../entities';
import { ApplicationModule } from './application.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationOnboarding, ApplicationService]),
    ApplicationModule,
  ],
  controllers: [ServiceAdditionController],
  providers: [ServiceAdditionService],
  exports: [ServiceAdditionService],
})
export class ServiceAdditionModule {}
