import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookieAuthentication.guard";
import { RequestWithUser } from "src/auth/requestWithUser.interface";
import { TokensQueryDto, TokenStateFilter } from "./dto/tokens-query.dto";
import { TokensService } from "./tokens.service";

@ApiTags("Tokens")
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
  async getTokens(
    @Req() request: RequestWithUser,
    @Query() tokensQueryDto: TokensQueryDto
  ) {
    const { page, limit, state } = tokensQueryDto;
    return await this.tokens.getUserTokens(
      request.user.id,
      page ?? 1,
      limit ?? 30,
      state ?? TokenStateFilter.ALL
    );
  }

  @Get("all")
  @UseGuards(AdminGuard)
  async getAllTokens(@Query() page: number, @Query() limit: number) {
    return await this.tokens.allTokens(page, limit);
  }

  @Delete(":token")
  @UseGuards(CookieAuthenticationGuard)
  async revoke(
    @Req() request: RequestWithUser,
    @Param("token") tokenId: number
  ) {
    await this.tokens.removeToken(request.user, tokenId);
    return {
      message: "Token revoked successfully"
    };
  }
}
