import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [TokensService],
  controllers: [TokensController],
})
export class TokensModule {}
