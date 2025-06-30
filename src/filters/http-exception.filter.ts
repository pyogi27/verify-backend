import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IdGenerator } from '../utils/id-generator.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unable to register application due to internal error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      if (status === HttpStatus.CONFLICT) {
        message = 'Service already subscribed';
      } else if (status === HttpStatus.UNAUTHORIZED) {
        message = 'Unauthorized';
      } else if (status === HttpStatus.FORBIDDEN) {
        message = 'Forbidden';
      } else if (status === HttpStatus.BAD_REQUEST) {
        message = exception.message;
      }
    }

    const errorResponse = {
      data: [],
      responseMessages: [
        {
          id: IdGenerator.generateId(),
          type: 'E',
          text: message,
        },
      ],
    };

    response.status(status).json(errorResponse);
  }
}
