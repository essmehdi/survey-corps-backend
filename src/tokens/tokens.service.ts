import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  Prisma,
  PrismaClient,
  Privilege,
  Submission,
  Token,
  User
} from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
import { randomUUID } from "crypto";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";
import { paginatedResponse } from "src/utils/response";
import { TokenStateFilter } from "./dto/tokens-query.dto";

@Injectable()
export class TokensService {
  private readonly NO_USER_PROJECTION: Prisma.TokenSelect = {
    id: true,
    token: true,
    createdAt: true,
    submitted: true
  };
  private readonly logger = new Logger(TokensService.name);

  constructor(private prisma: PrismaService) {}

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaError.RecordDoesNotExist)
        throw new NotFoundException("Token does not exist");
      else if (error.code === PrismaError.RecordsNotFound)
        throw new NotFoundException("Token not found");
    }
    throw new InternalServerErrorException("An error has occured");
  }

  private async getTokensAndCount(tokenFindManyArgs: Prisma.TokenFindManyArgs) {
    return await this.prisma.$transaction([
      this.prisma.token.findMany(tokenFindManyArgs),
      this.prisma.token.count({ where: tokenFindManyArgs.where })
    ]);
  }

  /**
   * Generates a new submission token and credited to the user
   * @param userId User to generate token for
   */
  async generateTokenForUser(userId: number) {
    return await this.prisma.token.create({
      data: {
        token: randomUUID(),
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
  }

  /**
   * Generates a new submission token (for form applications)
   */
  async generateToken() {
    return await this.prisma.token.create({
      data: {
        token: randomUUID()
      }
    });
  }

  /**
   * Gets the token by ID
   * @param tokenId ID of the token
   */
  async getToken(tokenId: number) {
    try {
      return await this.prisma.token.findUniqueOrThrow({
        where: { id: tokenId }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Revokes the token
   * @param tokenId ID of the token to remove
   * @returns
   */
  async removeToken(user: User, tokenId: number) {
    try {
      const whereCondition =
        user.privilege === Privilege.ADMIN
          ? { id: tokenId }
          : { id: tokenId, user: { id: user.id } };

      await this.prisma.token.delete({
        where: whereCondition
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Gets all created tokens
   * @param limit Number of elements in a page
   */
  async allTokens(page: number = 1, limit: number = 30) {
    const [tokens, count] = await this.getTokensAndCount({
      take: limit,
      skip: limit * (page - 1),
      orderBy: { id: "asc" }
    });

    return paginatedResponse(tokens, page, limit, count);
  }

  /**
   * Gets all tokens generated by a user
   * @param userId ID of the user
   * @param page Number of page
   * @param limit Number of elements in a page
   */
  async getUserTokens(
    userId: number,
    page: number = 1,
    limit: number = 30,
    stateFilter: TokenStateFilter = TokenStateFilter.ALL
  ) {
    const stateFilterArgs =
      stateFilter === TokenStateFilter.ALL
        ? {}
        : stateFilter === TokenStateFilter.PENDING
        ? { submitted: false }
        : { submitted: true };

    const [tokens, count] = await this.getTokensAndCount({
      where: { userId, ...stateFilterArgs },
      select: this.NO_USER_PROJECTION,
      take: limit,
      skip: limit * (page - 1),
      orderBy: [{ submitted: "asc" }, { createdAt: "desc" }]
    });

    return paginatedResponse(tokens, page, limit, count);
  }

  /**
   * Verifies if a token exists and valid for submission (not used before)
   * @param token Token to validate
   */
  async isTokenValidForSubmission(token: string) {
    const validToken = await this.prisma.token.findFirst({
      where: { token, submitted: false }
    });

    return !!validToken;
  }

  /**
   * Adds an 'isSubmitted' boolean based on the token submissions number
   * @param tokens Array of tokens to modify
   * @returns The array of tokens with the added field
   */
  getTokensWithSubmission(
    tokens: Partial<Token & { submissions: Partial<Submission>[] }>[]
  ) {
    return tokens.map((token) => {
      const submissions = token.submissions.length;
      delete token["submissions"];
      return { ...token, isSubmitted: submissions > 0 };
    });
  }
}
