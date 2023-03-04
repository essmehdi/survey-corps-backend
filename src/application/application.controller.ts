import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApplicationService } from "./application.service";
import { CreateApplicationDto } from "./dto/add-application.dto";
import {
  ApplicationsQueryDto,
  StatusOptions
} from "./dto/applications-query.dto";

@ApiTags("Alumni application")
@Controller()
export class ApplicationController {
  constructor(private applications: ApplicationService) {}

  /**
   * Sends an application for the form
   */
  @Post("applications")
  async apply(@Body() applicationDto: CreateApplicationDto) {
    const { fullname, email } = applicationDto;
    return await this.applications.addApplication(fullname, email);
  }

  /**
   * Gets the list of applications
   */
  @Get("admin/applications")
  @UseGuards(AdminGuard)
  async getAllApplications(@Query() getApplicationsDto: ApplicationsQueryDto) {
    const { status } = getApplicationsDto;
    if (status === StatusOptions.PENDING)
      return await this.applications.getAllPendingApplications();
    return await this.applications.getAllRespondedApplications();
  }

  /**
   * Gets one application
   */
  @Get("admin/applications/:application")
  @UseGuards(AdminGuard)
  async getApplication(@Param("application") applicationId: number) {
    return await this.applications.getApplication(applicationId);
  }

  /**
   * Accepts an application
   */
  @Post("admin/applications/:application/accept")
  @UseGuards(AdminGuard)
  async acceptApplication(@Param("application") applicationId: number) {
    await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.GRANTED
    );
    return {
      message: "The application has been successfully accepted"
    };
  }

  /**
   * Rejects an application
   */
  @Post("admin/applications/:application/reject")
  @UseGuards(AdminGuard)
  async rejectApplication(@Param("application") applicationId: number) {
    await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.REJECTED
    );
    return {
      message: "The application has been successfully rejected"
    };
  }
}
