import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

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
}
