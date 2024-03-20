import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaError } from "prisma-error-enum";

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter<PrismaClientKnownRequestError> {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception.code === PrismaError.RecordsNotFound) {
      Logger.debug(JSON.stringify(exception));
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Resource not found"
      });
      return;
    } else {
      super.catch(exception, host);
    }
  }
}
