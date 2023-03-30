import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { RegisterUserPasswordDto } from "./dto/register-user-password.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersQueryDto } from "./dto/users-query.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  /**
   * Gets all registered users
   */
  @Get()
  @UseGuards(AdminGuard)
  async allUsers(@Query() usersQueryDto: UsersQueryDto) {
    const { privilege, page, limit, search } = usersQueryDto;
    return this.users.getAllUsers(privilege, page, limit, search);
  }

  /**
   * Gets info about the authenticated user
   */
  @Get("me")
  @UseGuards(CookieAuthenticationGuard)
  async me(@Request() request: RequestWithUser) {
    const { fullname, email, privilege } = request.user;
    return { fullname, email, privilege };
  }

  /**
   * Registers a new user
   */
  @Post("register")
  @UseGuards(AdminGuard)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { fullname, email, privilege } = registerUserDto;
    await this.users.createUser(fullname, email, privilege);
    return {
      message: "User successfully registered"
    };
  }

  /**
   * Resends registration link to unregistered user
   */
  @Post(":id/resend")
  @UseGuards(AdminGuard)
  async resendRegistrationLink(@Param("id") id: number) {
    return await this.users.resendRegistrationLink(id);
  }

  /**
   * Verifies if the provided token is valid (exists & not expired)
   */
  @Get("register/:token")
  async verifyRegistrationToken(@Param("token") token: string) {
    return await this.users.verifyRegistrationToken(token);
  }

  /**
   * Registers a password for user
   */
  @Post("register/:token")
  async registerUserPassword(
    @Param("token") token: string,
    @Body() registerUserPasswordDto: RegisterUserPasswordDto
  ) {
    const { password } = registerUserPasswordDto;
    await this.users.registerUserPassword(token, password);
    return {
      message: "Password updated successfully"
    };
  }

  /**
   * Gets user data
   */
  @Get(":id")
  @UseGuards(AdminGuard)
  async getUser(@Param("id") id: number) {
    return await this.users.getUserById(id, false);
  }

  /**
   * Updates user data
   */
  @Patch(":id")
  @UseGuards(AdminGuard)
  async updateUser(
    @Param("id") id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const { fullname, email, privilege } = updateUserDto;
    await this.users.updateUser(id, fullname, email, privilege);
    return {
      message: "User updated successfully"
    };
  }

  /**
   * Disables user account
   */
  @Post(":id/disable")
  @UseGuards(AdminGuard)
  async disableUser(@Param("id") id: number) {
    await this.users.disableUser(id);
    return {
      message: "User account disabled successfully"
    };
  }

  /**
   * Gets users leaderboard
   */
  @Get("leaderboard")
  async leaderboard() {
    return this.users.getLeaderboard();
  }
}
