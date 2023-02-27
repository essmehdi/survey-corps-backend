import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma, Privilege, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import * as nodemailer from "nodemailer";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { NotFoundError } from "@prisma/client/runtime";
import { PrismaError } from "prisma-error-enum";
import { PrivilegeFilter } from "./dto/users-query.dto";
import { paginatedResponse } from "src/utils/response";
import { convertToTsquery } from "src/utils/strings";

const charsPool =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-=+";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private static PUBLIC_PROJECTION = {
    id: true,
    fullname: true,
    email: true,
    _count: {
      select: {
        tokens: {
          where: {
            submitted: true
          }
        }
      }
    }
  };
  private static PASSWORD_PROJECTION = {
    password: true
  };
  private static PRIVILEGE_PROJECTION = {
    privilege: true
  };
  private static PRIVATE_PROJECTION = {
    ...UsersService.PUBLIC_PROJECTION,
    ...UsersService.PRIVILEGE_PROJECTION
  };

  private static ALL_PROJECTION = {
    ...UsersService.PUBLIC_PROJECTION,
    ...UsersService.PASSWORD_PROJECTION,
    ...UsersService.PRIVILEGE_PROJECTION
  };

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private static generatePassword(length: number) {
    let password = "";
    for (let i = 0; i < length; i++)
      password += charsPool.charAt(
        Math.floor(Math.random() * charsPool.length)
      );
    return password;
  }

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === PrismaError.UniqueConstraintViolation &&
        error.meta?.target[0] === "email"
      ) {
        throw new ConflictException("This email already exists");
      } else if (error.code === PrismaError.RecordsNotFound) {
        throw new NotFoundException("User not found");
      }
    }
    throw new InternalServerErrorException("An error has occured");
  }

  private async getUsersAndCount(userFindManyArgs: Prisma.UserFindManyArgs) {
    return await this.prisma.$transaction([
      this.prisma.user.findMany(userFindManyArgs),
      this.prisma.user.count({ where: userFindManyArgs.where })
    ]);
  }

  async getAllUsers(
    privilegeFilter: PrivilegeFilter,
    page: number = 1,
    limit: number = 30,
    search?: string
  ) {
    try {
      const whereQuery: Prisma.UserWhereInput =
        privilegeFilter !== PrivilegeFilter.ALL
          ? { privilege: privilegeFilter }
          : {};

      if (search) whereQuery.fullname = { search: convertToTsquery(search) };

      const [users, count] = await this.getUsersAndCount({
        where: whereQuery,
        take: limit,
        skip: limit * (page - 1),
        orderBy: { id: "asc" },
        select: UsersService.PRIVATE_PROJECTION
      });

      return paginatedResponse(users, page, limit, count);
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async getUserById(id: number, allFields: boolean = false) {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { id },
        select: allFields
          ? UsersService.ALL_PROJECTION
          : UsersService.PRIVATE_PROJECTION
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async getUserByEmail(email: string, allFields: boolean = false) {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { email },
        select: allFields
          ? UsersService.ALL_PROJECTION
          : UsersService.PRIVATE_PROJECTION
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async getLeaderboard() {
    return (
      await this.prisma.user.findMany({
        where: {
          tokens: {
            some: {}
          }
        },
        select: {
          ...UsersService.PUBLIC_PROJECTION,
          _count: {
            select: {
              tokens: {
                where: {
                  submitted: true
                }
              }
            }
          }
        }
      })
    ).map(({ fullname, email, _count }) => ({
      fullname,
      email,
      count: _count.tokens
    }));
  }

  async createUser(
    fullname: string,
    email: string,
    privilege: Privilege = "MEMBER"
  ) {
    // Generate a random password for the user
    const randomPassword =
      process.env.NODE_ENV === "production"
        ? UsersService.generatePassword(12)
        : "password";
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
      service: this.config.get<string>("MAIL_SERVICE"),
      auth: {
        user: this.config.get<string>("MAIL_USERNAME"),
        pass: this.config.get<string>("MAIL_PASSWORD")
      },
      from: `"ENSIAS Bridge Technical Team" <${this.config.get<string>(
        "MAIL_USERNAME"
      )}>`
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
