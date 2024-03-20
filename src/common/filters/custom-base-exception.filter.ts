import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { BaseException } from "../exceptions/base.exception";
import { BaseExceptionFilter } from "@nestjs/core";

@Catch(BaseException)
export class CustomBaseExceptionFilter extends BaseExceptionFilter<BaseException> {
  private readonly logger = new Logger(BaseExceptionFilter.name);

  catch(exception: BaseException, host: ArgumentsHost) {
    this.logger.error(exception.message, exception.stack);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.publicMessage || exception.message
    });
  }
}
