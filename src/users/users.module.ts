import { Module } from "@nestjs/common";
import { MailModule } from "src/mail/mail.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
  imports: [MailModule]
})
export class UsersModule {}
