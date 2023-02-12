import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { isUUID } from "class-validator";
import { TokensService } from "../tokens.service";

/**
 * A guard that checks if a token is valid for submission
 */
@Injectable()
export class UnusedTokenGuard implements CanActivate {
  constructor(private tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.params.token;
    return (
      !!token &&
      isUUID(token) &&
      (await this.tokens.isTokenValidForSubmission(token))
    );
  }
}
