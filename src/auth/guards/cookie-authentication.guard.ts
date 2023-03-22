import {
  CanActivate,
  ExecutionContext,
  HttpCode,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";

@Injectable()
export class CookieAuthenticationGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.isAuthenticated()) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "You are not logged in",
        reason: "LOGIN"
      });
    }
    if (!request.user.isActive) {
      throw new UnauthorizedException({
        statudCode: HttpStatus.UNAUTHORIZED,
        message: "Your account is suspended",
        reason: "SUSPENDED"
      });
    }
    return true;
  }
}
