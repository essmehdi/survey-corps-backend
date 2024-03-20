import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma, Privilege, User } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";
import { TokenStateFilter } from "./dto/tokens-query.dto";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private prisma: PrismaService) {}

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
   *
   * @throws {ResourceNotFoundException} If the token is not found
   */
  async getToken(tokenId: number) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId }
    });
    if (!token) {
      throw new ResourceNotFoundException(`Token ${tokenId}`);
    }
    return token;
  }

  /**
   * Revokes the token
   * @param tokenId ID of the token to remove
   * @returns
   */
  async removeToken(user: User, tokenId: number) {
    const whereCondition =
      user.privilege === Privilege.ADMIN
        ? { id: tokenId }
        : { id: tokenId, user: { id: user.id } };

    await this.prisma.token.delete({
      where: whereCondition
    });
  }

  /**
   * Gets all created tokens page
   * @param page Number of page
   * @param limit Number of elements in a page
   * @param stateFilter Filter by token state
   */
  async allTokens(
    page: number = 1,
    limit: number = 30,
    stateFilter: TokenStateFilter = TokenStateFilter.ALL,
    search?: string
  ) {
    const stateFilterArgs =
      stateFilter === TokenStateFilter.ALL
        ? {}
        : stateFilter === TokenStateFilter.PENDING
        ? { submitted: false }
        : { submitted: true };

    return await this.getTokensAndCount({
      where: {
        ...(search
          ? {
              user: {
                OR: search
                  .replace(/\s+/g, " ")
                  .trim()
                  .split(" ")
                  .map((word) => [
                    {
                      firstname: { contains: word, mode: "insensitive" }
                    },
                    {
                      lastname: { contains: word, mode: "insensitive" }
                    }
                  ])
                  .flatMap((x) => x) as Prisma.UserWhereInput[]
              }
            }
          : {}),
        ...stateFilterArgs
      },
      take: limit,
      skip: limit * (page - 1),
      orderBy: { createdAt: "desc" },
      include: {
        user: true
      }
    });
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

    return await this.getTokensAndCount({
      where: { userId, ...stateFilterArgs },
      take: limit,
      skip: limit * (page - 1),
      orderBy: [{ submitted: "asc" }, { createdAt: "desc" }]
    });
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
}
