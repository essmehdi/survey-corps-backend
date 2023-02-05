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

@Injectable()
export class AuthService {
  constructor(private users: UsersService) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.user({ email }, true);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException("Wrong credentials");
  }
}
