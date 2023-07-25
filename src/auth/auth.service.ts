import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException
} from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private users: UsersService) {}

  async validateUser(email: string, password: string) {
    try {
      const user: Partial<User> = await this.users.getUserByEmail(email, true);
      if (user.password === null) {
        throw new BadRequestException("Invalid credentials");
      }
      if (user && (await bcrypt.compare(password, user.password))) {
        return user;
      }
    } catch (error) {
      // User query throws a not found exception when a user is not found
      if (error instanceof NotFoundException) {
        throw new BadRequestException("Invalid credentials");
      } else {
        throw new InternalServerErrorException("An error has occured");
      }
    }
    throw new BadRequestException("Invalid credentials");
  }
}
