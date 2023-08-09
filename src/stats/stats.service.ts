import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gets global stats for all members
   */
  async getStats() {
    const members = await this.prisma.user.count();
    const tokens = await this.prisma.token.count();
    const submissions = await this.prisma.token.count({
      where: { submitted: true }
    });
    return {
      members,
      tokens,
      submissions
    };
  }

  /**
   * Get personal stats for the connected user
   * @param userId User's id
   */
  async getPersonalStats(userId: number) {
    const tokens = await this.prisma.token.count({
      where: { user: { id: userId } }
    });
    const submissions = await this.prisma.token.count({
      where: { user: { id: userId }, submitted: true }
    });
    return {
      tokens,
      submissions
    };
  }
}
