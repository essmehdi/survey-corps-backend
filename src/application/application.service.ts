import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";
import { StatusOptions } from "./dto/applications-query.dto";
import { MailService } from "src/mail/mail.service";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {}

  /**
   * Get applications and count
   * @param applicationWhereInput Prisma where input for the application
   * @returns List: [applications, count]
   */
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
   *
   * @throws {ResourceNotFoundException} If the application does not exist
   */
  async getApplication(applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId }
    });

    // Check if application exists
    if (!application) {
      throw new ResourceNotFoundException(`Application ${applicationId}`);
    }

    return application;
  }

  /**
   * Store the application into the database
   * @param fullname Full name of the applicant
   * @param email Email of the applicant
   */
  async addApplication(fullname: string, email: string) {
    return await this.prisma.application.create({
      data: { fullname, email }
    });
  }

  /**
   * Gets application based on criteria
   */
  async getApplicationsPage(
    status: StatusOptions,
    page: number = 1,
    limit: number = 10
  ) {
    return await this.getApplicationsAndCount({
      ...(status === StatusOptions.ALL
        ? {}
        : status === StatusOptions.RESPONDED
        ? { where: { status: { in: ["GRANTED", "REJECTED"] } } }
        : { where: { status } }),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Gets all the submitted applications
   */
  async getAllApplications() {
    return await this.prisma.application.findMany();
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
    return app;
  }
}
