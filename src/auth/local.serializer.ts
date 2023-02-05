import { UsersService } from "../users/users.service";
import { PassportSerializer } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: CallableFunction) {
    done(null, user.id);
  }

  async deserializeUser(id: number, done: CallableFunction) {
    const user = await this.usersService.user({ id }, true);
    done(null, user);
  }
}
