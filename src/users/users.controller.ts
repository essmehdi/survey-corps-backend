import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags
} from "@nestjs/swagger";
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
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdatePersonalDataDto } from "./dto/update-personal-data.dto";
import { plainToInstance } from "class-transformer";
import { UserAdminDto } from "./dto/user-admin.dto";
import { PaginatedResponse, paginatedResponse } from "src/utils/response";
import { LeaderboardMember } from "./dto/leaderboard-member.dto";
import { UserPublicDto } from "./dto/user-public.dto";
import { User } from "@prisma/client";
import { TransformDataInterceptor } from "src/utils/interceptors/TransformDataInterceptor";
import { MessageDto } from "src/utils/dto/message.dto";
import { TokenValidity } from "src/utils/dto/token-validity.dto";
import {
  ApiOkPaginatedResponse,
  PaginatedResponseDto
} from "src/utils/dto/paginated-response.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  /**
   * Gets all registered users
   */
  @Get()
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(UserAdminDto))
  @ApiOkPaginatedResponse(UserAdminDto)
  async allUsers(@Query() usersQueryDto: UsersQueryDto) {
    const { privilege, page, limit, search } = usersQueryDto;
    const [users, count] = await this.users.getAllUsersPage(
      privilege,
      page,
      limit,
      search
    );
    return paginatedResponse(users, page, limit, count);
  }

  /**
   * Gets info about the authenticated user
   */
  @Get("me")
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(new TransformDataInterceptor(UserPublicDto))
  @ApiOkResponse({
    type: () => UserPublicDto
  })
  me(@Request() request: RequestWithUser) {
    return request.user;
  }

  /**
   * Gets info about the authenticated user
   */
  @Patch("me")
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(new TransformDataInterceptor(UserPublicDto))
  @ApiOkResponse({
    type: () => UserPublicDto
  })
  async updateMe(
    @Request() request: RequestWithUser,
    @Body() updateUserDto: UpdatePersonalDataDto
  ) {
    const { firstname, lastname } = updateUserDto;
    return await this.users.updateUser(
      request.user.id,
      firstname,
      lastname,
      request.user.email
    );
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
  ): Promise<MessageDto> {
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
  async deleteProfilePicture(
    @Req() request: RequestWithUser
  ): Promise<MessageDto> {
    await this.users.deleteProfilePicture(request.user.id);
    return {
      message: "Profile picture deleted successfully"
    };
  }

  /**
   * Registers a new user
   */
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(UserAdminDto))
  @ApiCreatedResponse({
    type: () => UserAdminDto
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { firstname, lastname, email, privilege } = registerUserDto;
    return await this.users.createUser(firstname, lastname, email, privilege);
  }

  /**
   * Gets users leaderboard
   */
  @Get("leaderboard")
  @UseGuards(CookieAuthenticationGuard)
  @UseInterceptors(new TransformDataInterceptor(UserPublicDto))
  @ApiOkPaginatedResponse(UserAdminDto)
  async leaderboard(@Query() paginatedQuery: PaginationQueryDto) {
    const [leaderboard, count] = await this.users.getLeaderboardPage(
      paginatedQuery.page,
      paginatedQuery.limit
    );
    return paginatedResponse(
      leaderboard,
      paginatedQuery.page,
      paginatedQuery.limit,
      count
    );
  }

  /**
   * Verifies if the provided token is valid (exists & not expired)
   */
  @Get("register/:token")
  async verifyRegistrationToken(
    @Param("token", ParseUUIDPipe) token: string
  ): Promise<TokenValidity> {
    return await this.users.verifyRegistrationToken(token);
  }

  /**
   * Registers a password for user
   */
  @Post("register/:token")
  async registerUserPassword(
    @Param("token", ParseUUIDPipe) token: string,
    @Body() registerUserPasswordDto: RegisterUserPasswordDto
  ): Promise<MessageDto> {
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
  ): Promise<MessageDto> {
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
  ): Promise<TokenValidity> {
    return await this.users.verifyForgotPasswordToken(token);
  }

  /**
   * Change password for user
   */
  @Post("reset-password/:token")
  async resetPassword(
    @Param("token", ParseUUIDPipe) token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<MessageDto> {
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
  async resendRegistrationLink(
    @Param("id", ParseIntPipe) id: number
  ): Promise<MessageDto> {
    await this.users.resendRegistrationLink(id);
    return {
      message: "Resent registration mail successfully"
    };
  }

  /**
   * Gets user data
   */
  @Get(":id")
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(UserAdminDto))
  @ApiOkResponse({
    type: () => UserAdminDto
  })
  async getUser(@Param("id", ParseIntPipe) id: number) {
    return await this.users.getUserById(id);
  }

  /**
   * Updates user data
   */
  @Patch(":id")
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(UserAdminDto))
  @ApiOkResponse({
    type: () => UserAdminDto
  })
  async updateUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const { firstname, lastname, email, privilege } = updateUserDto;
    return await this.users.updateUser(
      id,
      firstname,
      lastname,
      email,
      privilege
    );
  }

  @Get(":id/profile-picture")
  @UseGuards(CookieAuthenticationGuard)
  @ApiOkResponse({
    description: "Profile picture octet stream"
  })
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
  async disableUser(
    @Param("id", ParseIntPipe) id: number
  ): Promise<MessageDto> {
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
  async enableUser(@Param("id", ParseIntPipe) id: number): Promise<MessageDto> {
    await this.users.enableUser(id);
    return {
      message: "User account enabled successfully"
    };
  }
}
