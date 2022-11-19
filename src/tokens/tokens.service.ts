import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { NotFoundError } from '@prisma/client/runtime';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor (private prisma: PrismaService) {}

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException("Token not found");
    } else {
      throw new InternalServerErrorException("An error has occured");
    }
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
      return await this.prisma.token.findUniqueOrThrow({ where: { id: tokenId } });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Revokes the token
   * @param tokenId ID of the token to remove
   * @returns 
   */
  async removeToken(tokenId: number) {
    return await this.prisma.token.delete({ where: { id: tokenId } });
  }

  /**
   * Gets all created tokens
   */
  async allTokens() {
    return await this.prisma.token.findMany();
  }

  /**
   * Gets all tokens generated by a user
   * @param userId ID of the user
   */
  async getUserTokens(userId: number) {
    return await this.prisma.token.findMany({ where: { userId } });
  }
}
