import {
  CanActivate,
  ExecutionContext,
  HttpCode,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { RequestWithUser } from "../request-with-user.interface";
import { Request } from "express";

@Injectable()
export class CookieAuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(CookieAuthenticationGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as
      | Request
      | RequestWithUser;
    if (!request.isAuthenticated()) {
      this.logger.verbose(
        `Unauthenticated request to ${request.path}: ${request.ip}`
      );
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "You are not logged in",
        reason: "LOGIN"
      });
    }
    if (!request.user.isActive && request.path !== "/users/me") {
      throw new UnauthorizedException({
        statudCode: HttpStatus.UNAUTHORIZED,
        message: "Your account is suspended",
        reason: "SUSPENDED"
      });
    }
    return true;
  }
}
