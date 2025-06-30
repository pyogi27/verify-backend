import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { IdGenerator } from '../../utils/id-generator.util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'E';

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse?.message) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message;
      }

      // Map HTTP status codes to error types
      if (status >= 400 && status < 500) {
        errorType = 'E'; // Client error
      } else if (status >= 500) {
        errorType = 'S'; // Server error
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.loggerService.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    }

    // Log the error
    this.loggerService.error(
      `HTTP ${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      'GlobalExceptionFilter',
    );

    // Log security events for authentication/authorization errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.loggerService.logSecurity('Authentication/Authorization Error', {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        status,
        message,
      });
    }

    // Prepare error response
    const errorResponse = {
      data: [],
      responseMessages: [
        {
          id: IdGenerator.generateId(),
          type: errorType,
          text: message,
        },
      ],
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      (errorResponse as any).debug = {
        stack: exception.stack,
        name: exception.name,
      };
    }

    response.status(status).json(errorResponse);
  }
}
