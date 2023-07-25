import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import { tap } from "rxjs";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { NotifierService } from "src/notifier/notifier.service";

@Injectable()
export class EditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EditInterceptor.name);
  constructor(private notifier: NotifierService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest() as RequestWithUser;
        const response = context.switchToHttp().getResponse();

        if (
          context.getType() === "http" &&
          ["POST", "PATCH", "DELETE"].includes(request.method) &&
          response.statusCode < 400
        ) {
          this.notifier.addEvent("edit", {
            type: this.getEditType(request),
            author: request.user?.id
          });
        }
      })
    );
  }

  private getEditType(request: RequestWithUser) {
    switch (true) {
      case request.path.includes("answers"):
        return "ANSWER";
      case request.path.includes("questions"):
        return "QUESTION";
      case request.path.includes("sections"):
        return "SECTION";
      default:
        return "UNKNOWN";
    }
  }
}
