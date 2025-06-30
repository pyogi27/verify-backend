import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logLevel = this.configService.get('app.logging.level', 'info');
    const maxFiles = this.configService.get('app.logging.maxFiles', '14d');
    const maxSize = this.configService.get('app.logging.maxSize', '20m');

    // Create transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, trace }) => {
              return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
            },
          ),
        ),
      }),
    ];

    // File transport for production
    if (this.configService.get('app.nodeEnv') === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize,
          maxFiles,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // Additional methods for structured logging
  logRequest(
    method: string,
    url: string,
    ip: string,
    userAgent?: string,
  ): void {
    this.log(
      `HTTP ${method} ${url} - IP: ${ip}${userAgent ? ` - UA: ${userAgent}` : ''}`,
      'HTTP',
    );
  }

  logResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.log(
      `HTTP ${method} ${url} - ${statusCode} - ${responseTime}ms`,
      'HTTP',
    );
  }

  logSecurity(event: string, details: Record<string, any>): void {
    this.log(`Security Event: ${event}`, 'SECURITY');
    this.log(JSON.stringify(details), 'SECURITY');
  }

  logDatabase(operation: string, table: string, duration: number): void {
    this.log(`DB ${operation} on ${table} - ${duration}ms`, 'DATABASE');
  }
}
