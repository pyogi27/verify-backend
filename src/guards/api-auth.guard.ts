import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationQueryService } from '../services/application-query.service';
import { LoggerService } from '../common/logger/logger.service';
import {
  InvalidApiCredentialsException,
  ApplicationInactiveException,
  ApiKeyExpiredException,
} from '../common/exceptions/custom-exceptions';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(
    private applicationQueryService: ApplicationQueryService,
    private loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = request.headers;

    // Extract authentication headers
    const apiKey = headers['x-app-auth-key'] as string;
    const apiSecret = headers['x-app-auth-secret'] as string;

    // Validate required headers
    if (!apiKey || !apiSecret) {
      this.loggerService.logSecurity('Missing Authentication Headers', {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      });
      throw new InvalidApiCredentialsException();
    }

    try {
      // Find application by API key (this service handles decryption)
      const application =
        await this.applicationQueryService.getApplicationByApiKey(apiKey);

      if (!application) {
        this.loggerService.logSecurity('Invalid API Key', {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          apiKey: this.maskApiKey(apiKey),
        });
        throw new InvalidApiCredentialsException();
      }

      // Validate API secret (already decrypted by the service)
      if (application.api_secret !== apiSecret) {
        this.loggerService.logSecurity('Invalid API Secret', {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          applicationId: application.application_id,
          apiKey: this.maskApiKey(apiKey),
        });
        throw new InvalidApiCredentialsException();
      }

      // Check if application is active
      if (!application.is_active) {
        this.loggerService.logSecurity('Inactive Application Access Attempt', {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          applicationId: application.application_id,
          applicationName: application.application_name,
        });
        throw new ApplicationInactiveException(application.application_id);
      }

      // Check if API key is expired
      if (new Date() > application.api_key_expiry) {
        this.loggerService.logSecurity('Expired API Key Access Attempt', {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          applicationId: application.application_id,
          applicationName: application.application_name,
          expiryDate: application.api_key_expiry,
        });
        throw new ApiKeyExpiredException(application.application_id);
      }

      // Store application in request for later use
      request.application = application;

      // Log successful authentication
      this.loggerService.logSecurity('Successful API Authentication', {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        applicationId: application.application_id,
        applicationName: application.application_name,
      });

      return true;
    } catch (error) {
      // Re-throw custom exceptions
      if (
        error instanceof InvalidApiCredentialsException ||
        error instanceof ApplicationInactiveException ||
        error instanceof ApiKeyExpiredException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        'Authentication service error',
        error instanceof Error ? error.stack : undefined,
        'ApiAuthGuard',
      );
      throw new InvalidApiCredentialsException();
    }
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    return `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 4)}`;
  }
}
