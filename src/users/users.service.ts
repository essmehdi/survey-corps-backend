import { ConflictException, HttpCode, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, LoggerService, NotFoundException } from '@nestjs/common';
import { Prisma, Privilege, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { NotFoundError } from '@prisma/client/runtime';

const charsPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-=+";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private static PUBLIC_PROJECTION = { id: false, fullname: true, email: true, password: false, privilege: true };
  private static ALL_PROJECTION = { id: true, fullname: true, email: true, password: true, privilege: true };

  constructor(private prisma: PrismaService, private config: ConfigService){}

  private static generatePassword(length: number) {
    let password = "";
    for (let i = 0; i < length; i++) 
      password += charsPool.charAt(Math.floor(Math.random() * charsPool.length));
    return password;
  }

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && !Array.isArray(error.meta?.target) && error.meta?.target === 'User_email_key') {
      throw new ConflictException("This email already exists");
    } else if (error instanceof NotFoundError) {
      throw new NotFoundException("User not found");
    } else {
      throw new InternalServerErrorException("An error has occured");
    }
  }

  async userSafe(userWhereUniqueInput: Prisma.UserWhereUniqueInput, allFields: boolean = false): Promise<User | null> {
    try {
      return await this.prisma.user.findUniqueOrThrow({ where: userWhereUniqueInput, select: allFields ? UsersService.ALL_PROJECTION : UsersService.PUBLIC_PROJECTION });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput, allFields: boolean = false): Promise<User | null> {
    try {
      return await this.prisma.user.findUniqueOrThrow({ where: userWhereUniqueInput, select: allFields ? UsersService.ALL_PROJECTION : UsersService.PUBLIC_PROJECTION });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }, allFields: boolean = false): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: allFields ? UsersService.ALL_PROJECTION : UsersService.PUBLIC_PROJECTION
    });
  }

  async createUser(fullname: string, email: string, privilege: Privilege = 'MEMBER') {
    // Generate a random password for the user
    const randomPassword = process.env.NODE_ENV === 'production' ? UsersService.generatePassword(12) : 'password';
    try {
      // Create the user
      await this.prisma.user.create({
        data: {
          fullname,
          email,
          privilege,
          password: await bcrypt.hash(randomPassword, await bcrypt.genSalt())
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
    // Sending email to user if everything goes right
    const registrationTransporter = nodemailer.createTransport({
      service: this.config.get<string>('MAIL_SERVICE'),
      auth: {
        user: this.config.get<string>('MAIL_USERNAME'),
        pass: this.config.get<string>('MAIL_PASSWORD')
      },
      from: `"ENSIAS Bridge Technical Team" <${this.config.get<string>('MAIL_USERNAME')}>`
    });
    await registrationTransporter.sendMail({
      to: email,
      subject: "ENSIAS Bridge Account creation",
      text: `Hello ${fullname},

Your ENSIAS account has been created. Use your email and the password provided below to authenticate on the platform.

${randomPassword}

Thank you for your collaboration and your committement.

Regards.

ENSIAS Bridge Survey Technical Team.
      `
    });
  }
}
