import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { appConfig } from './config/app.config';
import { ApplicationModule } from './modules/application.module';
import { ServiceAdditionModule } from './modules/service-addition.module';
import { ServiceUpdateModule } from './modules/service-update.module';
import { ServiceDeletionModule } from './modules/service-deletion.module';
import { VerificationGenerationModule } from './modules/verification-generation.module';
import { VerificationModule } from './modules/verification.module';
import { ResendVerificationModule } from './modules/resend-verification.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => getDatabaseConfig(),
    }),

    // Application modules
    LoggerModule,
    ApplicationModule,
    ServiceAdditionModule,
    ServiceUpdateModule,
    ServiceDeletionModule,
    VerificationGenerationModule,
    VerificationModule,
    ResendVerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
