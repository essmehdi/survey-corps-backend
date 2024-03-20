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
import { convertToTsquery } from "src/common/strings";
import { MailService } from "src/mail/mail.service";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { WeakPasswordException } from "./exceptions/weak-password.exception";
import { TokenExpiredException } from "./exceptions/token-expired.exception";
import { AlreadyRegisteredException } from "./exceptions/already-registered.exception";
import { EmailAlreadyExistsException } from "./exceptions/email-already-exists.exception";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";

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
  }

  /**
   * Gets a user by id
   * @param id User id
   * @returns The user
   *
   * @throws {ResourceNotFoundException} If the user is not found
   */
  async getUserById(id: number) {
    const user = await this.xprisma.user.findUnique({
      where: { id },
      select: UsersService.SELECT_SUBMISSIONS
    });
    if (!user) {
      throw new ResourceNotFoundException(`User ${id}`);
    }
    return user;
  }

  /**
   * Gets a user by email
   * @param email User email
   * @returns The user
   *
   * @throws {ResourceNotFoundException} If the user is not found
   */
  async getUserByEmail(email: string) {
    const user = await this.xprisma.user.findUniqueOrThrow({
      where: { email },
      select: UsersService.SELECT_SUBMISSIONS
    });
    if (!user) {
      throw new ResourceNotFoundException(`User <${email}>`);
    }
    return user;
  }

  /**
   * Updates user info
   * @param id User id to update
   * @param firstname New firstname
   * @param lastname New lastname
   * @param email New email
   * @param privilege New privilege
   *
   * @throws {EmailAlreadyExistsException} If the email already exists
   * @throws {ResourceNotFoundException} If the user is not found
   */
  async updateUser(
    id: number,
    firstname?: string,
    lastname?: string,
    email?: string,
    privilege?: Privilege
  ) {
    // Check if the email exists
    if (email) {
      const userWithEmail = await this.xprisma.user.findUnique({
        where: { email }
      });
      if (userWithEmail) {
        throw new EmailAlreadyExistsException();
      }
    }

    // Update user
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
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ResourceNotFoundException(`User ${id}`);
      }
      throw error;
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

    // Check if the email exists
    const userWithEmail = await this.xprisma.user.findUnique({
      where: { email }
    });
    if (userWithEmail) {
      throw new EmailAlreadyExistsException();
    }

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
  }

  /**
   * Verifies if a registration token is valid
   * @param token The token
   * @returns An object with "valid" field & "expired" field if it is not valid
   */
  async verifyRegistrationToken(token: string) {
    const t = await this.xprisma.registrationToken.findUnique({
      where: { token }
    });
    if (!t) {
      return {
        valid: false,
        expired: false
      };
    }
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
  }

  /**
   * Completes user registration by setting a password
   * @param token The registration token
   * @param password The user provided password
   *
   * @throws {WeakPasswordException} If the password is too weak
   * @throws {TokenExpiredException} If the token is expired
   */
  async registerUserPassword(token: string, password: string) {
    if (!this.checkPasswordStrength(password)) {
      throw new WeakPasswordException();
    }
    const t = await this.xprisma.registrationToken.findUniqueOrThrow({
      where: { token },
      include: { user: true }
    });
    if (
      new Date().getTime() - t.createdAt.getTime() >
      UsersService.REGISTRATION_TOKEN_LIFESPAN
    ) {
      throw new TokenExpiredException();
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
  }

  /**
   * Resends the registration link to the user
   * @param userId User's id
   *
   * @throws {AlreadyRegisteredException} If you call this function on an already registered user
   */
  async resendRegistrationLink(userId: number) {
    const user = await this.xprisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { registrationToken: true }
    });
    if (user.isActive || user.password !== null) {
      throw new AlreadyRegisteredException();
    }
    const newToken = randomUUID();
    await this.xprisma.registrationToken.update({
      where: { id: user.registrationToken.id },
      data: {
        token: newToken,
        createdAt: new Date()
      }
    });
    await this.mail.sendRegistrationEmail(user.email, user.firstname, newToken);
  }

  /**
   * Verifies password reset token
   * @param token The password reset token
   * @returns An object with "valid" field & "expired" field if it is not valid
   */
  async verifyForgotPasswordToken(token: string) {
    const t = await this.prisma.forgotPasswordToken.findUnique({
      where: { token }
    });
    if (!t) {
      return {
        valid: false,
        expired: false
      };
    }
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
      throw new WeakPasswordException();
    }
    const t = await this.prisma.forgotPasswordToken.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!t) {
      return {
        valid: false,
        expired: false
      };
    }
    if (
      new Date().getTime() - t.createdAt.getTime() >
      UsersService.PASSWORD_RESET_TOKEN_LIFESPAN
    ) {
      throw new TokenExpiredException();
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
    await this.xprisma.user.update({
      where: { id: userId },
      data: {
        isActive: false
      }
    });
  }

  /**
   * Enables user account
   * @param userId User's id
   */
  async enableUser(userId: number) {
    await this.xprisma.user.update({
      where: { id: userId },
      data: {
        isActive: true
      }
    });
  }

  /**
   * Gets a user profile picture
   * @param userId User id
   * @returns The buffer array of the picture
   */
  async getProfilePictureBuffer(userId: number) {
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
  }

  /**
   * Changes user profile picture
   * @param userId User id
   * @param buffer The new picture buffer
   */
  async updateProfilePicture(userId: number, buffer: Buffer) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: buffer
      }
    });
  }

  /**
   * Deletes user profile picture
   * @param userId User id
   */
  async deleteProfilePicture(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: null
      }
    });
  }
}
