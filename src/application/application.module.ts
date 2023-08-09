import { Module } from "@nestjs/common";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";
import { MailModule } from "src/mail/mail.module";

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [MailModule]
})
export class ApplicationModule {}
