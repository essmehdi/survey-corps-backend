import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { TokensModule } from "src/tokens/tokens.module";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [TokensModule]
})
export class ApplicationModule {}
