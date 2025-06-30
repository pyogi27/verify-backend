import { HttpException, HttpStatus } from '@nestjs/common';

export class ApplicationNotFoundException extends HttpException {
  constructor(applicationId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Application not found: ${applicationId}`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ServiceNotFoundException extends HttpException {
  constructor(serviceType: string, applicationId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Service ${serviceType} not found for application: ${applicationId}`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class VerificationRequestNotFoundException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Verification request not found: ${requestId}`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ServiceAlreadyExistsException extends HttpException {
  constructor(serviceType: string, applicationId: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Service ${serviceType} already exists for application: ${applicationId}`,
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class VerificationRequestAlreadyExistsException extends HttpException {
  constructor(userIdentity: string, serviceType: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Active verification request already exists for ${userIdentity} with service ${serviceType}`,
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class VerificationRequestExpiredException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Verification request expired: ${requestId}`,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid token provided: ${requestId}`,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MaxAttemptsExceededException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Maximum verification attempts exceeded: ${requestId}`,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MaxResendAttemptsExceededException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Maximum resend attempts exceeded: ${requestId}`,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class VerificationRequestAlreadyVerifiedException extends HttpException {
  constructor(requestId: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Verification request already verified: ${requestId}`,
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ApplicationInactiveException extends HttpException {
  constructor(applicationId: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Application is inactive: ${applicationId}`,
        error: 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ApiKeyExpiredException extends HttpException {
  constructor(applicationId: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `API key has expired for application: ${applicationId}`,
        error: 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidApiCredentialsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid API credentials',
        error: 'Unauthorized',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
