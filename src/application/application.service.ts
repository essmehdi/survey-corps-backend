import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException
} from "@nestjs/common";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";
import { TokensService } from "src/tokens/tokens.service";

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

  constructor(private prisma: PrismaService, private tokens: TokensService) {}

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException("Application not found");
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      !Array.isArray(error.meta?.target) &&
      error.meta?.target === "Application_email_key"
    ) {
      throw new ConflictException("This email has already applied");
    } else {
      throw new InternalServerErrorException("An error has occured");
    }
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
   * Gets all the submitted applications
   */
  async getAllApplications() {
    return await this.prisma.application.findMany({
      select: ApplicationService.PUBLIC_PROJECTION
    });
  }

  /**
   * Gets all application that got responded
   */
  async getAllRespondedApplications() {
    return await this.prisma.application.findMany({
      where: {
        status: {
          not: "PENDING"
        }
      },
      select: ApplicationService.PUBLIC_PROJECTION
    });
  }

  /**
   * Gets all pending applications
   */
  async getAllPendingApplications() {
    return await this.prisma.application.findMany({
      where: {
        status: "PENDING"
      },
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
      // TODO: Send an email to the applicant with a tokenized link
      return await this.prisma.application.update({
        where: { id },
        data,
        select: ApplicationService.PUBLIC_PROJECTION
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
