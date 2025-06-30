import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  security: {
    bcryptRounds: number;
    jwtSecret: string;
    jwtExpiresIn: string;
    encryptionKey: string;
  };
  logging: {
    level: string;
    maxFiles: string;
    maxSize: string;
  };
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      jwtSecret:
        process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-in-production',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
      encryptionKey:
        process.env.ENCRYPTION_KEY || 'ClcaJHXmnZYW4475KtDO5JEivQWdmGkD',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
    },
  }),
);

export const appConfigValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().optional(),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  BCRYPT_ROUNDS: Joi.number().default(12),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  ENCRYPTION_KEY: Joi.string().required(),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_MAX_FILES: Joi.string().default('14d'),
  LOG_MAX_SIZE: Joi.string().default('20m'),
});
