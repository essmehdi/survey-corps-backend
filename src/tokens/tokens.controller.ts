import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { AllTokensQueryDto } from "./dto/all-tokens-query.dto";
import { TokensQueryDto, TokenStateFilter } from "./dto/tokens-query.dto";
import { TokensService } from "./tokens.service";
import {
  ApiOkPaginatedResponse,
  PaginatedResponseDto
} from "src/common/dto/paginated-response.dto";
import { TransformDataInterceptor } from "src/common/interceptors/TransformDataInterceptor";
import { TokenWithUserDto } from "./dto/token-with-user.dto";
import { TokenDto } from "./dto/token.dto";
import { MessageDto } from "src/common/dto/message.dto";

@ApiTags("Tokens")
@Controller("tokens")
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private tokens: TokensService) {}

  /**
   * Generates a token for the authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(new TransformDataInterceptor(TokenDto))
  @ApiCreatedResponse({
    type: TokenDto
  })
  async generate(@Req() request: RequestWithUser) {
    const token = await this.tokens.generateTokenForUser(request.user.id);
    this.logger.log(
      `Token generated for ${request.user.email} (${request.user.firstname} ${request.user.lastname}): ${token.token}`
    );
    return token;
  }

  /**
   * Gets user generated tokens
   */
  @Get()
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(new TransformDataInterceptor(TokenDto))
  @ApiOkPaginatedResponse(TokenDto)
  async getTokens(
    @Req() request: RequestWithUser,
    @Query() tokensQueryDto: TokensQueryDto
  ) {
    const { page, limit, state } = tokensQueryDto;
    const [tokens, count] = await this.tokens.getUserTokens(
      request.user.id,
      page,
      limit,
      state ?? TokenStateFilter.ALL
    );
    return PaginatedResponseDto.from(tokens, page, limit, count);
  }

  /**
   * Gets all generated tokens
   */
  @Get("all")
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(TokenWithUserDto))
  @ApiOkPaginatedResponse(TokenWithUserDto)
  async getAllTokens(@Query() allTokensQueryDto: AllTokensQueryDto) {
    const { page, limit, state, search } = allTokensQueryDto;
    const [tokens, count] = await this.tokens.allTokens(
      page,
      limit,
      state,
      search
    );
    return PaginatedResponseDto.from(tokens, page, limit, count);
  }

  /**
   * Revokes a token by deleting it
   */
  @Delete(":token")
  @UseGuards(CookieAuthenticationGuard)
  async revoke(
    @Req() request: RequestWithUser,
    @Param("token", ParseIntPipe) tokenId: number
  ): Promise<MessageDto> {
    await this.tokens.removeToken(request.user, tokenId);
    return {
      message: "Token revoked successfully"
    };
  }
}
