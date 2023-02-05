import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookieAuthentication.guard";
import { RequestWithUser } from "src/auth/requestWithUser.interface";
import { TokensService } from "./tokens.service";

@Controller("tokens")
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private tokens: TokensService) {}

  @Post()
  @UseGuards(CookieAuthenticationGuard)
  async generate(@Req() request: RequestWithUser) {
    const token = await this.tokens.generateTokenForUser(request.user.id);
    this.logger.log(
      "Token created by " + request.user.fullname + ": " + token.token
    );
    return token;
  }

  @Get()
  @UseGuards(CookieAuthenticationGuard)
  async getTokens(@Req() request: RequestWithUser) {
    return await this.tokens.getUserTokens(request.user.id);
  }

  @Get("all")
  @UseGuards(AdminGuard)
  async getAllTokens() {
    return await this.tokens.allTokens();
  }

  @Delete(":token")
  @UseGuards(CookieAuthenticationGuard)
  async revoke(
    @Req() request: RequestWithUser,
    @Param("token") tokenId: number
  ) {
    const token = await this.tokens.getToken(tokenId);
    if (token.userId === request.user.id) {
      await this.tokens.removeToken(tokenId);
      return {
        message: "Token deleted successfully"
      };
    } else {
      throw new UnauthorizedException("You cannot remove this token");
    }
  }
}
