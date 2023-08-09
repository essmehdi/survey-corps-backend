import { AdminStatsDto } from "./admin-stats.dto";
import { GeneralStatsDto } from "./general-stats.dto";

export class StatsDto {
  personalStats: GeneralStatsDto;
  globalStats?: AdminStatsDto;
}
