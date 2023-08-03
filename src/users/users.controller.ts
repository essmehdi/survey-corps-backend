import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  PayloadTooLargeException,
  Post,
  Put,
  Query,
  Req,
  Request,
  Res,
  StreamableFile,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors
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
import { createReadStream } from "fs";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdatePersonalDataDto } from "./dto/update-personal-data.dto";

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
    const { id, firstname, lastname, email, privilege, isActive } =
      request.user;
    return { id, firstname, lastname, email, privilege, isActive };
  }

  /**
   * Gets info about the authenticated user
   */
  @Patch("me")
  @UseGuards(CookieAuthenticationGuard)
  async updateMe(
    @Request() request: RequestWithUser,
    @Body() updateUserDto: UpdatePersonalDataDto
  ) {
    const { firstname, lastname } = updateUserDto;
    await this.users.updateUser(
      request.user.id,
      firstname,
      lastname,
      request.user.email
    );
    return {
      message: "User updated successfully"
    };
  }

  /**
   * Changes the profile picture of the connected user
   */
  @Put("me/profile-picture")
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: (_, file, callback) => {
        if (file.size > 1024 * 1024 * 5) {
          callback(
            new PayloadTooLargeException("File must be less than 5MB"),
            false
          );
        }
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          callback(
            new UnsupportedMediaTypeException("File must be an image"),
            false
          );
        }
        callback(null, true);
      }
    })
  )
  async updateProfilePicture(
    @Req() request: RequestWithUser,
    @UploadedFile() file: Express.Multer.File
  ) {
    await this.users.updateProfilePicture(request.user.id, file.buffer);
    return {
      message: "Profile picture updated successfully"
    };
  }

  /**
   * Removes the profile picture of the connected user
   */
  @Delete("me/profile-picture")
  @UseGuards(CookieAuthenticationGuard)
  async deleteProfilePicture(@Req() request: RequestWithUser) {
    await this.users.deleteProfilePicture(request.user.id);
    return {
      message: "Profile picture deleted successfully"
    };
  }

  /**
   * Registers a new user
   */
  @Post("register")
  @UseGuards(AdminGuard)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { firstname, lastname, email, privilege } = registerUserDto;
    await this.users.createUser(firstname, lastname, email, privilege);
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
   * Verify password reset token
   */
  @Get("reset-password/:token")
  async verifyForgotPasswordToken(
    @Param("token", ParseUUIDPipe) token: string
  ) {
    return await this.users.verifyForgotPasswordToken(token);
  }

  /**
   * Change password for user
   */
  @Post("reset-password/:token")
  async resetPassword(
    @Param("token", ParseUUIDPipe) token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    const { password } = resetPasswordDto;
    await this.users.resetUserPassword(token, password);
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
    const { firstname, lastname, email, privilege } = updateUserDto;
    await this.users.updateUser(id, firstname, lastname, email, privilege);
    return {
      message: "User updated successfully"
    };
  }

  @Get(":id/profile-picture")
  @UseGuards(CookieAuthenticationGuard)
  async getProfilePicture(
    @Param("id", ParseIntPipe) id: number,
    @Res() response: Response
  ) {
    const buffer = await this.users.getProfilePictureBuffer(id);
    const { fileTypeFromBuffer } = await import("file-type");
    const fileType = await fileTypeFromBuffer(buffer);
    response.setHeader("Content-Type", fileType.mime);
    response.setHeader("Content-Disposition", "inline");
    response.send(buffer);
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
