import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class LogInWithCredentialsGuard extends AuthGuard("local") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    await super.logIn(request);

    if (request.user && !request.user.isActive) {
      throw new BadRequestException("Invalid credentials");
    }

    return true;
  }
}
