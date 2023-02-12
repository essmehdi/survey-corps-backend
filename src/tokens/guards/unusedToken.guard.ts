import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TokensService } from "../tokens.service";

/**
 * A guard that checks if a token is valid for submission
 */
@Injectable()
export class UnusedTokenGuard implements CanActivate {
  constructor(private tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.token;
    return await this.tokens.isTokenValidForSubmission(token);
  }
}
