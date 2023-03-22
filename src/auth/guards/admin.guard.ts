import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { CookieAuthenticationGuard } from "./cookie-authentication.guard";

@Injectable()
export class AdminGuard extends CookieAuthenticationGuard {
  canActivate(context: ExecutionContext) {
    if (!super.canActivate(context)) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    return request.user.privilege === "ADMIN";
  }
}
