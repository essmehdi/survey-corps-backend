import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards
} from "@nestjs/common";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookieAuthentication.guard";
import { RequestWithUser } from "src/auth/requestWithUser.interface";
import { RegisterUserDto } from "./dto/RegisterUserDto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  @UseGuards(CookieAuthenticationGuard)
  async me(@Request() request: RequestWithUser) {
    const { fullname, email, privilege } = request.user;
    return { fullname, email, privilege };
  }

  @Post("register")
  @UseGuards(AdminGuard)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { fullname, email, privilege } = registerUserDto;
    await this.users.createUser(fullname, email, privilege);
    return {
      message: "User successfully registered"
    };
  }

  @Get("leaderboard")
  async leaderboard() {
    return this.users.getLeaderboard();
  }
}
