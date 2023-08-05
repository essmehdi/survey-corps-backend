import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException
} from "@nestjs/common";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";
import { TokensService } from "src/tokens/tokens.service";
import { StatusOptions } from "./dto/applications-query.dto";
import { paginatedResponse } from "src/utils/response";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  private static PUBLIC_PROJECTION = {
    id: true,
    fullname: true,
    email: true,
    status: true
  };
  private static ALL_PROJECTION = {
    id: true,
    fullname: true,
    email: true,
    status: true,
    tokenId: true
  };

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private tokens: TokensService
  ) {}

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === PrismaError.UniqueConstraintViolation &&
        error.meta?.target[0] === "email"
      ) {
        throw new ConflictException("This email has already applied");
      } else if (error.code === PrismaError.RecordsNotFound) {
        throw new NotFoundException("The requested application was not found");
      } else if (error.code === PrismaError.RecordDoesNotExist) {
        throw new NotFoundException("The requested application does not exist");
      }
    }
    throw new InternalServerErrorException("An error has occured");
  }

  private async getApplicationsAndCount(
    applicationWhereInput: Prisma.ApplicationFindManyArgs
  ) {
    return await this.prisma.$transaction([
      this.prisma.application.findMany(applicationWhereInput),
      this.prisma.application.count({
        where: applicationWhereInput.where
      })
    ]);
  }

  /**
   * Get an application by ID
   * @param applicationId ID of the application
   */
  async getApplication(applicationId: number) {
    try {
      return await this.prisma.application.findUniqueOrThrow({
        where: { id: applicationId }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Store the application into the database
   * @param fullname Full name of the applicant
   * @param email Email of the applicant
   */
  async addApplication(fullname: string, email: string) {
    try {
      return await this.prisma.application.create({
        data: { fullname, email },
        select: { id: true, fullname: true, email: true, status: true }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Gets application based on criteria
   */
  async getApplications(
    status: StatusOptions,
    page: number = 1,
    limit: number = 10
  ) {
    const [applications, count] = await this.getApplicationsAndCount({
      ...(status === StatusOptions.ALL
        ? {}
        : status === StatusOptions.RESPONDED
        ? { where: { status: { in: ["GRANTED", "REJECTED"] } } }
        : { where: { status } }),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    });

    return paginatedResponse(applications, page, limit, count);
  }

  /**
   * Gets all the submitted applications
   */
  async getAllApplications() {
    return await this.prisma.application.findMany({
      select: ApplicationService.PUBLIC_PROJECTION
    });
  }

  /**
   * Changes the status of the application
   * @param id ID of the application
   * @param newStatus Response for the application
   */
  async respondToApplication(id: number, newStatus: ApplicationStatus) {
    const data = {
      status: newStatus
    };

    if (newStatus === ApplicationStatus.GRANTED) {
      // Create a new token if application is accepted
      data["token"] = {
        create: {
          token: randomUUID()
        }
      };
    } else {
      // Revoke token if application becomes pending or rejected
      data["token"] = {
        delete: true
      };
    }

    try {
      const app = await this.prisma.$transaction(async (tx) => {
        const application = await tx.application.update({
          where: { id },
          include: { token: true },
          data
        });
        await this.mail.sendApplicationApproved(
          application.email,
          application.fullname,
          application.token.token
        );
        return application;
      });
      delete app["token"];
      return app;
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
