import { Controller, HttpCode, Post, Request, Response, UseGuards } from '@nestjs/common';
import { CookieAuthenticationGuard } from './cookieAuthentication.guard';
import { LogInWithCredentialsGuard } from './logInWithCredentials.guard';
import { RequestWithUser } from './requestWithUser.interface';
import { Response as ExpressResponse } from "express";

@Controller('auth')
export class AuthController {

  @Post('login')
  @HttpCode(200)
  @UseGuards(LogInWithCredentialsGuard)
  async logIn(@Request() request: RequestWithUser) {
    const { fullname, email, privilege } = request.user;
    return { fullname, email, privilege };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
  async logOut(@Request() request: RequestWithUser, @Response() response: ExpressResponse) {
    // @ts-ignore
    request.logout(request.user, (err: any, next: any) => {
      if (err) next(err);
      response.json({
        message: "Logged out successfully"
      });
    });
  }
}
