import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { AllTokensQueryDto } from "./dto/all-tokens-query.dto";
import { TokensQueryDto, TokenStateFilter } from "./dto/tokens-query.dto";
import { TokensService } from "./tokens.service";

@ApiTags("Tokens")
@Controller("tokens")
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private tokens: TokensService) {}

  /**
   * Generates a token for the authenticated user
   */
  @Post()
  @UseGuards(CookieAuthenticationGuard)
  async generate(@Req() request: RequestWithUser) {
    const token = await this.tokens.generateTokenForUser(request.user.id);
    this.logger.log(
      "Token created by " + request.user.fullname + ": " + token.token
    );
    return token;
  }

  /**
   * Gets user generated tokens
   */
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

  /**
   * Gets all generated tokens
   */
  @Get("all")
  @UseGuards(AdminGuard)
  async getAllTokens(@Query() allTokensQueryDto: AllTokensQueryDto) {
    const { page, limit, state, search } = allTokensQueryDto;
    return await this.tokens.allTokens(page, limit, state, search);
  }

  /**
   * Revokes a token by deleting it
   */
  @Delete(":token")
  @UseGuards(CookieAuthenticationGuard)
  async revoke(
    @Req() request: RequestWithUser,
    @Param("token", ParseIntPipe) tokenId: number
  ) {
    await this.tokens.removeToken(request.user, tokenId);
    return {
      message: "Token revoked successfully"
    };
  }
}
