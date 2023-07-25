import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";

@Controller("stats")
@UseGuards(CookieAuthenticationGuard)
export class StatsController {
  constructor(private stats: StatsService) {}

  /**
   * Gets general stats for all members
   */
  @Get()
  async getStats(@Req() request: RequestWithUser) {
    const response = {};
    if (request.user.privilege === "ADMIN") {
      const globalStats = await this.stats.getStats();
      response["globalStats"] = globalStats;
    }
    const personalStats = await this.stats.getPersonalStats(request.user);
    response["personalStats"] = personalStats;
    return response;
  }
}
