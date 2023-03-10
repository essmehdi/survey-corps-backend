import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma, Privilege } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PrismaError } from "prisma-error-enum";
import { PrivilegeFilter } from "./dto/users-query.dto";
import { paginatedResponse } from "src/utils/response";
import { convertToTsquery } from "src/utils/strings";
import { MailService } from "src/mail/mail.service";
import { randomUUID } from "crypto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import * as bcrypt from "bcrypt";

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

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService
  ) {}

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

  async updateUser(
    id: number,
    fullname: string,
    email: string,
    privilege?: Privilege
  ) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { fullname, email, ...(privilege ? { privilege } : {}) }
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
    const token = randomUUID();
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create the user
        const newUser = await tx.user.create({
          data: {
            fullname,
            email,
            privilege
          }
        });
        // Create registration token
        await tx.registrationToken.create({
          data: {
            token,
            user: {
              connect: { id: newUser.id }
            }
          }
        });
        // Send mail
        await this.mail.sendRegistrationEmail(email, fullname, token);
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async verifyRegistrationToken(token: string) {
    try {
      await this.prisma.registrationToken.findUniqueOrThrow({
        where: { token }
      });
      return true;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordsNotFound
      ) {
        return false;
      }
      this.handleQueryException(error);
    }
  }

  /**
   * Completes user registration by setting a password
   */
  async registerUserPassword(token: string, password: string) {
    try {
      const t = await this.prisma.registrationToken.findUniqueOrThrow({
        where: { token },
        include: { user: true }
      });
      await this.prisma.user.update({
        where: { id: t.user.id },
        data: {
          password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
          isActive: true
        }
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordsNotFound
      ) {
        throw new ForbiddenException("Invalid token");
      } else {
        throw new InternalServerErrorException("An error has occured");
      }
    }
  }
}
