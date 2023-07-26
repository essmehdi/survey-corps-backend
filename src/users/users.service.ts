import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { Prisma, PrismaClient, Privilege, User } from "@prisma/client";
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
  private xprisma: any;
  private readonly logger = new Logger(UsersService.name);
  private static readonly REGISTRATION_TOKEN_LIFESPAN = 259200000; // 3 days
  private static readonly PASSWORD_RESET_TOKEN_LIFESPAN = 86400000; // 1 days
  private static PUBLIC_PROJECTION = {
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    isActive: true,
    registered: true,
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
  ) {
    this.xprisma = prisma.$extends({
      name: "UserExtendedPrismaClient",
      result: {
        user: {
          registered: {
            needs: { isActive: true, password: true },
            compute(user) {
              return user.password !== null;
            }
          }
        }
      }
    });
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
    return await this.xprisma.$transaction([
      this.xprisma.user.findMany(userFindManyArgs),
      this.xprisma.user.count({ where: userFindManyArgs.where })
    ]);
  }

  private getFullname(user: User) {
    return `${user.firstname} ${user.lastname}`;
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

      const tsquery = convertToTsquery(search);
      if (search) {
        whereQuery.OR = [
          { firstname: { search: tsquery } },
          { lastname: { search: tsquery } },
          { email: { search: tsquery } }
        ];
      }

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
      return await this.xprisma.user.findUniqueOrThrow({
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
      return await this.xprisma.user.findUniqueOrThrow({
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
    firstname: string,
    lastname: string,
    email: string,
    privilege?: Privilege
  ) {
    try {
      await this.xprisma.user.update({
        where: { id },
        data: {
          firstname,
          lastname,
          email,
          ...(privilege ? { privilege } : {})
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async getLeaderboard(page: number = 1, limit: number = 30) {
    const [leaderboard, count] = await this.getUsersAndCount({
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
    });

    return paginatedResponse(
      leaderboard.map(({ firstname, lastname, email, _count }) => ({
        firstname,
        lastname,
        email,
        count: _count.tokens
      })),
      page,
      limit,
      count
    );
  }

  async createUser(
    firstname: string,
    lastname: string,
    email: string,
    privilege: Privilege = "MEMBER"
  ) {
    const token = randomUUID();
    try {
      // Create the user
      const newUser = await this.xprisma.user.create({
        data: {
          firstname,
          lastname,
          email,
          privilege,
          registrationToken: {
            create: {
              token
            }
          }
        }
      });
      // Send mail
      await this.mail.sendRegistrationEmail(
        email,
        this.getFullname(newUser),
        token
      );
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async verifyRegistrationToken(token: string) {
    try {
      const t = await this.xprisma.registrationToken.findUniqueOrThrow({
        where: { token }
      });
      // Check if it's not expired
      if (
        new Date().getMilliseconds() - t.createdAt.getMilliseconds() >
        UsersService.REGISTRATION_TOKEN_LIFESPAN
      ) {
        return {
          valid: false,
          expired: true
        };
      }
      return {
        valid: true
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordsNotFound
      ) {
        return {
          valid: false
        };
      }
      this.handleQueryException(error);
    }
  }

  /**
   * Completes user registration by setting a password
   */
  async registerUserPassword(token: string, password: string) {
    try {
      const t = await this.xprisma.registrationToken.findUniqueOrThrow({
        where: { token },
        include: { user: true }
      });
      if (
        new Date().getMilliseconds() - t.createdAt.getMilliseconds() >
        UsersService.REGISTRATION_TOKEN_LIFESPAN
      ) {
        throw new ForbiddenException("Expired token");
      }
      await this.xprisma.user.update({
        where: { id: t.user.id },
        data: {
          password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
          isActive: true,
          registrationToken: {
            delete: true
          }
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

  /**
   * Resends the registration link to the user
   * @param userId User's id
   */
  async resendRegistrationLink(userId: number) {
    try {
      const user = await this.xprisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { registrationToken: true }
      });
      if (user.isActive || user.password !== null) {
        throw new UnprocessableEntityException(
          "This user is already registered"
        );
      }
      const newToken = randomUUID();
      await this.xprisma.registrationToken.update({
        where: { id: user.registrationToken.id },
        data: {
          token: newToken,
          createdAt: new Date()
        }
      });
      await this.mail.sendRegistrationEmail(
        user.email,
        this.getFullname(user),
        newToken
      );
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Verify password reset token
   */
  async verifyForgotPasswordToken(token: string) {
    try {
      const t = await this.prisma.forgotPasswordToken.findUniqueOrThrow({
        where: { token }
      });
      // Check if it's not expired
      if (!this.checkForgotPasswordTokenValidity(t.createdAt)) {
        return {
          valid: false,
          expired: true
        };
      }
      return {
        valid: true
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordsNotFound
      ) {
        return {
          valid: false
        };
      }
      this.handleQueryException(error);
    }
  }

  /**
   * Send a password reset link to the user
   */
  async sendPasswordResetLink(email: string) {
    const presentToken = await this.prisma.forgotPasswordToken.findFirst({
      where: { user: { email } }
    });

    await this.prisma.$transaction(async (tx) => {
      if (presentToken) {
        await tx.forgotPasswordToken.delete({ where: { id: presentToken.id } });
      }

      const token = randomUUID();
      const user = await tx.user.update({
        where: { email },
        data: {
          forgotPasswordToken: {
            create: {
              token
            }
          }
        }
      });
      await this.mail.sendPasswordResetEmail(
        user.email,
        this.getFullname(user),
        token
      );
    });
  }

  /**
   * Reset user password using password reset token
   */
  async resetUserPassword(token: string, password: string) {
    try {
      const t = await this.prisma.forgotPasswordToken.findUniqueOrThrow({
        where: { token },
        include: { user: true }
      });
      if (
        new Date().getMilliseconds() - t.createdAt.getMilliseconds() >
        UsersService.PASSWORD_RESET_TOKEN_LIFESPAN
      ) {
        throw new ForbiddenException("Expired token");
      }
      await this.prisma.user.update({
        where: { id: t.user.id },
        data: {
          password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
          forgotPasswordToken: {
            delete: true
          }
        }
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordsNotFound
      ) {
        throw new ForbiddenException("Invalid token");
      }
      this.handleQueryException(error);
    }
  }

  private async checkForgotPasswordTokenValidity(createdAt: Date) {
    return (
      new Date().getMilliseconds() - createdAt.getMilliseconds() <
      UsersService.PASSWORD_RESET_TOKEN_LIFESPAN
    );
  }

  /**
   * Disables user account
   * @param userId User's id
   */
  async disableUser(userId: number) {
    try {
      await this.xprisma.user.update({
        where: { id: userId },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Enables user account
   * @param userId User's id
   */
  async enableUser(userId: number) {
    try {
      await this.xprisma.user.update({
        where: { id: userId },
        data: {
          isActive: true
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
