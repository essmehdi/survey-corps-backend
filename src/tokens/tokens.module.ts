import { Module } from "@nestjs/common";
import { TokensService } from "./tokens.service";
import { TokensController } from "./tokens.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { UnusedTokenGuard } from "./guards/unusedToken.guard";

@Module({
  providers: [TokensService],
  controllers: [TokensController],
  exports: [TokensService, UnusedTokenGuard]
})
export class TokensModule {}
