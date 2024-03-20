import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { CookieAuthenticationGuard } from "./cookie-authentication.guard";

@Injectable()
export class AdminGuard extends CookieAuthenticationGuard {
  private readonly adminLogger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!super.canActivate(context)) {
      this.adminLogger.verbose(
        `Admin resource access denied for ${
          request.user?.email ?? "unknown user"
        }`
      );
      return false;
    }
    return request.user.privilege === "ADMIN";
  }
}
