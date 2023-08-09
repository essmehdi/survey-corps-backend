import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { StatsDto } from "./dto/stats.dto";
import { GeneralStatsDto } from "./dto/general-stats.dto";
import { AdminStatsDto } from "./dto/admin-stats.dto";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Stats")
@Controller("stats")
@UseGuards(CookieAuthenticationGuard)
export class StatsController {
  constructor(private stats: StatsService) {}

  /**
   * Gets stats for the authenticated user (and global stats for admins)
   */
  @Get()
  @UseGuards(CookieAuthenticationGuard)
  @ApiOkResponse({
    description:
      "Global stats are included if the authenticated user is an admin",
    type: StatsDto
  })
  async getStats(@Req() request: RequestWithUser): Promise<StatsDto> {
    const response: StatsDto = {} as StatsDto;
    if (request.user.privilege === "ADMIN") {
      response.globalStats = await this.stats.getStats();
    }
    response.personalStats = await this.stats.getPersonalStats(request.user.id);
    return response;
  }
}
