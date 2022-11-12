import { Injectable, InternalServerErrorException, Logger, LoggerService, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor (private prisma: PrismaService) {}

  private handleQueryException(error: any) {
    this.logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException("Application not found");
    } else {
      throw new InternalServerErrorException("An error has occured");
    }
  }

  /**
   * Get an application by ID
   * @param applicationId ID of the application
   */
  async getApplication(applicationId: number) {
    return await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
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
   * Gets all the submitted applications
   */
  async getAllApplications() {
    return await this.prisma.application.findMany();
  }

  /**
   * Gets all application that got responded
   */
  async getAllRespondedApplications() {
    return await this.prisma.application.findMany({ where: { status: { not: 'PENDING' } } });
  }

  /**
   * Gets all pending applications
   */
  async getAllPendingApplications() {
    return await this.prisma.application.findMany({ where: { status: 'PENDING' } });
  }

  /**
   * Changes the status of the application
   * @param id ID of the application
   * @param newStatus Response for the application
   */
  async respondToApplication(id: number, newStatus: ApplicationStatus) {
    try {
      return await this.prisma.application.update({ where: { id }, data: { status: newStatus } });
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
