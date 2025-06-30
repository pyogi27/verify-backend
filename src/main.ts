import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
const compression = require('compression');
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Compression middleware
  app.use(compression());

  // CORS configuration
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-app-auth-key',
      'x-app-auth-secret',
      'x-app-auth-nonce',
    ],
  });

  // Global prefix
  const apiPrefix = configService.get('app.apiPrefix');
  // app.setGlobalPrefix(apiPrefix); // Commented out for easier testing

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: configService.get('app.nodeEnv') === 'production',
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

  // Swagger documentation
  if (configService.get('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Verify Backend API')
      .setDescription('Authentication and verification services API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Applications', 'Application management endpoints')
      .addTag('Services', 'Service configuration endpoints')
      .addTag(
        'Verification',
        'Verification generation and validation endpoints',
      )
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('app.port');
  await app.listen(port);

  loggerService.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  loggerService.log(
    `Environment: ${configService.get('app.nodeEnv')}`,
    'Bootstrap',
  );

  if (configService.get('app.nodeEnv') !== 'production') {
    loggerService.log(
      `Swagger documentation: http://localhost:${port}/api-docs`,
      'Bootstrap',
    );
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
