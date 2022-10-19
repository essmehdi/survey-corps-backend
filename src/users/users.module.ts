import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  imports: [PrismaModule]
})
export class UsersModule {}
