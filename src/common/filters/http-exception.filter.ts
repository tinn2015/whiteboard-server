import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  // Logger,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'winston';

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  constructor(private readonly logger: Logger) {}
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // 这里获得response
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as object);
    this.logger.log('error', `http error ${status}`, error);
    response.status(status).json({
      ...error,
      code: status,
      timestamp: new Date().toISOString(),
    });
  }
}
