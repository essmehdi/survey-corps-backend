import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UseGuards
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CookieAuthenticationGuard } from "src/auth/guards/cookie-authentication.guard";
import { RequestWithUser } from "src/auth/request-with-user.interface";
import { RegisterUserPasswordDto } from "./dto/register-user-password.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersQueryDto } from "./dto/users-query.dto";
import { UsersService } from "./users.service";
import { PaginationQueryDto } from "src/utils/dto/pagination-query.dto";
import { ResetPasswordRequestDto } from "./dto/reset-password-request.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

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
    return await this.users.getAllUsers(privilege, page, limit, search);
  }

  /**
   * Gets info about the authenticated user
   */
  @Get("me")
  @UseGuards(CookieAuthenticationGuard)
  async me(@Request() request: RequestWithUser) {
    const { id, fullname, email, privilege, isActive } = request.user;
    return { id, fullname, email, privilege, isActive };
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
   * Gets users leaderboard
   */
  @Get("leaderboard")
  @UseGuards(CookieAuthenticationGuard)
  async leaderboard(@Query() paginatedQuery: PaginationQueryDto) {
    return await this.users.getLeaderboard(
      paginatedQuery.page,
      paginatedQuery.limit
    );
  }

  /**
   * Verifies if the provided token is valid (exists & not expired)
   */
  @Get("register/:token")
  async verifyRegistrationToken(@Param("token", ParseUUIDPipe) token: string) {
    return await this.users.verifyRegistrationToken(token);
  }

  /**
   * Registers a password for user
   */
  @Post("register/:token")
  async registerUserPassword(
    @Param("token", ParseUUIDPipe) token: string,
    @Body() registerUserPasswordDto: RegisterUserPasswordDto
  ) {
    const { password } = registerUserPasswordDto;
    await this.users.registerUserPassword(token, password);
    return {
      message: "Password updated successfully"
    };
  }

  /**
   * Resends registration link to unregistered user
   */
  @Post(":id/resend")
  @UseGuards(AdminGuard)
  async resendRegistrationLink(@Param("id", ParseIntPipe) id: number) {
    return await this.users.resendRegistrationLink(id);
  }

  /**
   * Sends a password reset link to user
   */
  @Post("reset-password")
  async sendPasswordResetLink(
    @Req() request: RequestWithUser,
    @Body() resetPasswordDto: ResetPasswordRequestDto
  ) {
    const { email } = resetPasswordDto;
    if (email) {
      await this.users.sendPasswordResetLink(email);
    } else if (request.isAuthenticated()) {
      await this.users.sendPasswordResetLink(request.user.email);
    } else {
      throw new BadRequestException("Email is required");
    }
    return {
      message: "Password reset link sent successfully"
    };
  }

  /**
   * Change password for user
   */
  @Post("reset-password/:token")
  async resetPassword(
    @Req() request: RequestWithUser,
    @Param("token", ParseUUIDPipe) token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    const { password } = resetPasswordDto;
    await this.users.resetUserPassword(request.user, token, password);
    return {
      message: "Password updated successfully"
    };
  }

  /**
   * Gets user data
   */
  @Get(":id")
  @UseGuards(AdminGuard)
  async getUser(@Param("id", ParseIntPipe) id: number) {
    return await this.users.getUserById(id, false);
  }

  /**
   * Updates user data
   */
  @Patch(":id")
  @UseGuards(AdminGuard)
  async updateUser(
    @Param("id", ParseIntPipe) id: number,
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
  async disableUser(@Param("id", ParseIntPipe) id: number) {
    await this.users.disableUser(id);
    return {
      message: "User account disabled successfully"
    };
  }

  /**
   * Enables user account
   */
  @Post(":id/enable")
  @UseGuards(AdminGuard)
  async enableUser(@Param("id", ParseIntPipe) id: number) {
    await this.users.enableUser(id);
    return {
      message: "User account enabled successfully"
    };
  }
}
