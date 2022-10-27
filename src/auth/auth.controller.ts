import { Controller, HttpCode, Post, Req, Request, UseGuards } from '@nestjs/common';
import { CookieAuthenticationGuard } from './cookieAuthentication.guard';
import { LogInWithCredentialsGuard } from './logInWithCredentials.guard';
import { RequestWithUser } from './requestWithUser.interface';

@Controller('auth')
export class AuthController {

  @Post('login')
  @HttpCode(200)
  @UseGuards(LogInWithCredentialsGuard)
  async logIn(@Request() request: RequestWithUser) {
    return request.user;
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
  async logOut(@Request() request: RequestWithUser) {
    // @ts-ignore
    request.logOut();
  }
}
