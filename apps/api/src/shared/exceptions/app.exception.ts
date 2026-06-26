import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }

  static notFound(resource: string, id?: string): AppException {
    const msg = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    return new AppException('NOT_FOUND', msg, HttpStatus.NOT_FOUND);
  }

  static conflict(message: string): AppException {
    return new AppException('CONFLICT', message, HttpStatus.CONFLICT);
  }

  static forbidden(message = 'Access denied'): AppException {
    return new AppException('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }

  static validation(message: string): AppException {
    return new AppException('VALIDATION_ERROR', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
