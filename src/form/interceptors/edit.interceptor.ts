import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";
import { Request } from "express";
import { NotifierService } from "src/notifier/notifier.service";

export class EditInterceptor implements NestInterceptor {
  constructor(private notifier: NotifierService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest() as Request;
        const response = context.switchToHttp().getResponse();
        if (
          context.getType() === "http" &&
          ["POST", "PUT", "DELETE"].includes(request.method) &&
          response.statusCode < 400
        ) {
          this.notifier.addEvent("edit", {
            type: this.getEditType(request)
          });
        }
      })
    );
  }

  private getEditType(request: Request) {
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
