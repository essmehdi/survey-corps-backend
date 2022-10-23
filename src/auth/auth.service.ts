import { Injectable, NotAcceptableException } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor (private users: UsersService) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.user({ email });
    if (!user) {
      throw new NotAcceptableException("Could not find user");
    }
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
}
