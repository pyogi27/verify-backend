import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Log incoming request
    this.loggerService.logRequest(
      request.method,
      request.url,
      request.ip || 'unknown',
      request.get('User-Agent'),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Log successful response
          this.loggerService.logResponse(
            request.method,
            request.url,
            response.statusCode,
            responseTime,
          );
        },
        error: (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Log error response
          this.loggerService.error(
            `HTTP ${request.method} ${request.url} - ${response.statusCode} - ${responseTime}ms - Error: ${error.message}`,
            error.stack,
            'LoggingInterceptor',
          );
        },
      }),
    );
  }
}
