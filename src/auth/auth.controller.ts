import {
  Controller,
  HttpCode,
  Post,
  Request,
  Response,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { CookieAuthenticationGuard } from "./guards/cookie-authentication.guard";
import { LogInWithCredentialsGuard } from "./guards/login-with-credentials.guard";
import { RequestWithUser } from "./request-with-user.interface";
import { Response as ExpressResponse } from "express";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { TransformDataInterceptor } from "src/utils/interceptors/TransformDataInterceptor";
import { UserPublicDto } from "src/users/dto/user-public.dto";
import { MessageDto } from "src/utils/dto/message.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  /**
   * Log in a user
   */
  @Post("login")
  @HttpCode(200)
  @UseGuards(LogInWithCredentialsGuard)
  @UseInterceptors(new TransformDataInterceptor(UserPublicDto))
  @ApiOkResponse({
    type: UserPublicDto
  })
  logIn(@Request() request: RequestWithUser) {
    return request.user;
  }

  /**
   * Log out a user
   */
  @Post("logout")
  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
  @ApiOkResponse({
    type: MessageDto
  })
  async logOut(
    @Request() request: RequestWithUser,
    @Response() response: ExpressResponse
  ) {
    // @ts-ignore
    request.logout(request.user, (err: any, next: any) => {
      if (err) next(err);
      response.json({
        message: "Logged out successfully"
      });
    });
  }
}
