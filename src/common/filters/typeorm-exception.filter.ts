import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  //   Logger,
  Inject,
  Injectable,
} from '@nestjs/common';
import { QueryFailedError, TypeORMError } from 'typeorm';
import { Response } from 'express';
import { Logger } from 'winston';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter<T extends QueryFailedError>
  implements ExceptionFilter
{
  constructor(private readonly logger: Logger) {}
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // 这里获得response
    const response = ctx.getResponse<Response>();

    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const { message } = exception;
    // const exceptionResponse = exception.getResponse();
    // const error =
    //   typeof exceptionResponse === 'string'
    //     ? { message: exceptionResponse }
    //     : (exceptionResponse as object);
    this.logger.log('error', `db error`, message);
    response.status(status).json({
      error: message,
      code: status,
      timestamp: new Date().toISOString(),
    });
  }
}
