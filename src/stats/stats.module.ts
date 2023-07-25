import { Module } from "@nestjs/common";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  providers: [StatsService],
  controllers: [StatsController],
  exports: []
})
export class StatsModule {}
