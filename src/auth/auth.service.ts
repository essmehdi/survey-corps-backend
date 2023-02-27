import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException
} from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private users: UsersService) {}

  async validateUser(email: string, password: string) {
    const user: Partial<User> = await this.users.getUserByEmail(email, true);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException("Wrong credentials");
  }
}
