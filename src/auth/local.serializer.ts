import { UsersService } from '../users/users.service';
import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
 
@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }
 
  serializeUser(user: User, done: CallableFunction) {
    done(null, user.email);
  }
 
  async deserializeUser(email: string, done: CallableFunction) {
    const user = await this.usersService.userSafe({ email });
    done(null, user);
  }
}