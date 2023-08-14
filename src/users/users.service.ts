import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { Prisma, PrismaPromise, Privilege, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PrismaError } from "prisma-error-enum";
import { PrivilegeFilter } from "./dto/users-query.dto";
import { convertToTsquery } from "src/utils/strings";
import { MailService } from "src/mail/mail.service";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

@Injectable()
export class UsersService {
  private xprisma: ReturnType<typeof this.getExtendedClient>;
  private readonly logger = new Logger(UsersService.name);
  private static readonly REGISTRATION_TOKEN_LIFESPAN = 259200000; // 3 days
  private static readonly PASSWORD_RESET_TOKEN_LIFESPAN = 86400000; // 1 days
  private static readonly PASSWORD_CHECKER_OPTIONS = {
    translations: zxcvbnEnPackage.translations,
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary
    }
  };
  private static SELECT_SUBMISSIONS = {
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    isActive: true,
    password: true,
    privilege: true,
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

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService
  ) {
    this.xprisma = this.getExtendedClient();
    zxcvbnOptions.setOptions(UsersService.PASSWORD_CHECKER_OPTIONS);
  }

  /**
   * Returns a Prisma client with new fields:
   *  - "registered" to know if the user has registered using the link
   * @returns A Prisma client with extended user
   */
  private getExtendedClient() {
    return this.prisma.$extends({
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

  /**
   * Handle service query exception
   */
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

  /**
   * Returns matching users and the total users count
   * @param userFindManyArgs Prisma client args (findMany)
   * @returns The list of the users and the total count
   */
  private async getUsersAndCount(userFindManyArgs: Prisma.UserFindManyArgs) {
    userFindManyArgs.select = {
      ...(userFindManyArgs.select ?? {}),
      ...UsersService.SELECT_SUBMISSIONS
    };
    return await this.xprisma.$transaction([
      this.xprisma.user.findMany(userFindManyArgs) as PrismaPromise<
        (User & { _count?: any })[]
      >,
      this.xprisma.user.count({ where: userFindManyArgs.where })
    ]);
  }

  /**
   * Checks the password strength using "zxcvbn"
   * @param password The password
   * @returns True if the score is greater than or equal 3
   */
  private checkPasswordStrength(password: string) {
    return zxcvbn(password).score >= 3;
  }

  /**
   * Gets a page from the list of users
   * @param privilegeFilter A filter by privilege
   * @param page Page number
   * @param limit Page size
   * @param search Search term
   * @returns Page from users list
   */
  async getAllUsersPage(
    privilegeFilter: PrivilegeFilter,
    page: number,
    limit: number,
    search?: string
  ) {
    try {
      const whereQuery: Prisma.UserWhereInput =
        privilegeFilter !== PrivilegeFilter.ALL
          ? { privilege: privilegeFilter }
          : {};

      if (search) {
        const tsquery = convertToTsquery(search);
        whereQuery.OR = [
          { firstname: { search: tsquery } },
          { lastname: { search: tsquery } },
          { email: { search: tsquery } }
        ];
      }

      return await this.getUsersAndCount({
        where: whereQuery,
        take: limit,
        skip: limit * (page - 1),
        orderBy: { id: "asc" }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Gets a user by id
   * @param id User id
   * @returns The user
   */
  async getUserById(id: number) {
    try {
      return await this.xprisma.user.findUniqueOrThrow({
        where: { id },
        select: UsersService.SELECT_SUBMISSIONS
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Gets a user by email
   * @param email User email
   * @returns The user
   */
  async getUserByEmail(email: string) {
    try {
      return await this.xprisma.user.findUniqueOrThrow({
        where: { email },
        select: UsersService.SELECT_SUBMISSIONS
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Updates user info
   * @param id User id to update
   * @param firstname New firstname
   * @param lastname New lastname
   * @param email New email
   * @param privilege New privilege
   */
  async updateUser(
    id: number,
    firstname?: string,
    lastname?: string,
    email?: string,
    privilege?: Privilege
  ) {
    try {
      return await this.xprisma.user.update({
        where: { id },
        data: {
          firstname,
          lastname,
          email,
          privilege
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Gets a leaderboard page (ranked by tokens submitted)
   * @param page Page number
   * @param limit Page size
   * @returns The leaderboard page and the total count
   */
  async getLeaderboardPage(page: number, limit: number) {
    return await this.getUsersAndCount({
      where: {
        tokens: {
          some: {}
        }
      },
      take: limit,
      skip: limit * (page - 1),
      orderBy: {
        tokens: {
          _count: "desc"
        }
      }
    });
  }

  /**
   * Creates a new user & sends a registration email to user's email
   * @param firstname User's firstname
   * @param lastname User's lastname
   * @param email User's email
   * @param privilege User's privilege
   * @returns The newly created user
   */
  async createUser(
    firstname: string,
    lastname: string,
    email: string,
    privilege: Privilege = "MEMBER"
  ) {
    const token = randomUUID();
    try {
      return await this.xprisma.$transaction(async (tx) => {
        // Create the user
        const newUser = await tx.user.create({
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
        await this.mail.sendRegistrationEmail(email, newUser.firstname, token);

        return newUser;
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Verifies if a registration token is valid
   * @param token The token
   * @returns An object with "valid" field & "expired" field if it is not valid
   */
  async verifyRegistrationToken(token: string) {
    try {
      const t = await this.xprisma.registrationToken.findUniqueOrThrow({
        where: { token }
      });
      // Check if it's not expired
      if (
        new Date().getTime() - t.createdAt.getTime() >
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
   * @param token The registration token
   * @param password The user provided password
   */
  async registerUserPassword(token: string, password: string) {
    if (!this.checkPasswordStrength(password)) {
      throw new BadRequestException("A strong password is required");
    }
    try {
      const t = await this.xprisma.registrationToken.findUniqueOrThrow({
        where: { token },
        include: { user: true }
      });
      if (
        new Date().getTime() - t.createdAt.getTime() >
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
        user.firstname,
        newToken
      );
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Verifies password reset token
   * @param token The password reset token
   * @returns An object with "valid" field & "expired" field if it is not valid
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
   * @param email The email to send the link to
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
      await this.mail.sendPasswordResetEmail(user.email, user.firstname, token);
    });
  }

  /**
   * Reset user password using password reset token
   * @param token The password reset token
   * @param password The new password
   */
  async resetUserPassword(token: string, password: string) {
    if (!this.checkPasswordStrength(password)) {
      throw new BadRequestException("A strong password is required");
    }
    try {
      const t = await this.prisma.forgotPasswordToken.findUniqueOrThrow({
        where: { token },
        include: { user: true }
      });
      if (
        new Date().getTime() - t.createdAt.getTime() >
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
      new Date().getTime() - createdAt.getTime() <
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

  /**
   * Gets a user profile picture
   * @param userId User id
   * @returns The buffer array of the picture
   */
  async getProfilePictureBuffer(userId: number) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          profilePicture: true
        }
      });
      if (!user.profilePicture || user.profilePicture.length === 0) {
        return readFileSync(
          join(process.cwd(), "static", "default-profile-pic.jpg")
        );
      }
      return user.profilePicture;
    } catch (err) {
      this.handleQueryException(err);
    }
  }

  /**
   * Changes user profile picture
   * @param userId User id
   * @param buffer The new picture buffer
   */
  async updateProfilePicture(userId: number, buffer: Buffer) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: buffer
        }
      });
    } catch (err) {
      this.handleQueryException(err);
    }
  }

  /**
   * Deletes user profile picture
   * @param userId User id
   */
  async deleteProfilePicture(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: null
        }
      });
    } catch (err) {
      this.handleQueryException(err);
    }
  }
}
