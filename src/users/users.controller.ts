import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor (private users: UsersService) {}
  
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { fullname, email, privilege } = registerUserDto;
    await this.users.createUser(fullname, email, privilege);
    return {
      message: "User successfully registered"
    };
  }
}
