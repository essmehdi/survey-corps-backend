import { Controller, Get, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";

@Controller("stats")
@UseGuards(CookieAuthenticationGuard)
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get()
  async getStats() {
    return await this.stats.getStats();
  }
}
