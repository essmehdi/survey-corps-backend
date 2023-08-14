import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class UnsuccessfulInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UnsuccessfulInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      tap({
        complete: () => {
          const response = context.switchToHttp().getResponse();
          const request = context.switchToHttp().getRequest();
          if (!response.statusCode.toString().startsWith("2")) {
            this.logger.warn(
              `Request to ${request.url} from ${request.ip} returned ${response.statusCode}`
            );
          }
        }
      })
    );
  }
}
