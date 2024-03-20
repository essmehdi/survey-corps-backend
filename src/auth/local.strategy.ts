import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private auth: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string) {
    const success = await this.auth.validateUser(email, password);
    this.logger.verbose(
      `Login attempt for ${email} was ${
        success ? "successful" : "unsuccessful"
      }`
    );
    return success;
  }
}
