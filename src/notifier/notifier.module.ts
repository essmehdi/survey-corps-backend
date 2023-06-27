import { Module } from "@nestjs/common";
import { NotifierGateway } from "./notifier.gateway";
import { NotifierService } from "./notifier.service";

@Module({
  providers: [NotifierService, NotifierGateway],
  exports: [NotifierService]
})
export class NotifierModule {}
