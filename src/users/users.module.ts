import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  imports: [PrismaModule],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
