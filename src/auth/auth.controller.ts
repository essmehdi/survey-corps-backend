import {
  Controller,
  HttpCode,
  Post,
  Request,
  Response,
  UseGuards
} from "@nestjs/common";
import { CookieAuthenticationGuard } from "./guards/cookie-authentication.guard";
import { LogInWithCredentialsGuard } from "./guards/login-with-credentials.guard";
import { RequestWithUser } from "./request-with-user.interface";
import { Response as ExpressResponse } from "express";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  /**
   * Log in a user
   */
  @Post("login")
  @HttpCode(200)
  @UseGuards(LogInWithCredentialsGuard)
  async logIn(@Request() request: RequestWithUser) {
    const { fullname, email, privilege } = request.user;
    return { fullname, email, privilege };
  }

  /**
   * Log out a user
   */
  @Post("logout")
  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
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
