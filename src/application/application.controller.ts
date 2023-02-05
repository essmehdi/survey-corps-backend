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
import { ApplicationStatus } from "@prisma/client";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApplicationService } from "./application.service";
import { ApplicationDto } from "./dto/ApplicationDto";
import { GetApplicationsDto, StatusOptions } from "./dto/GetApplicationsDto";

@Controller()
export class ApplicationController {
  constructor(private applications: ApplicationService) {}

  @Post("applications")
  async apply(@Body() applicationDto: ApplicationDto) {
    const { fullname, email } = applicationDto;
    return await this.applications.addApplication(fullname, email);
  }

  @Get("admin/applications")
  @UseGuards(AdminGuard)
  async getAllApplications(@Query() getApplicationsDto: GetApplicationsDto) {
    const { status } = getApplicationsDto;
    if (status === StatusOptions.PENDING)
      return await this.applications.getAllPendingApplications();
    return await this.applications.getAllRespondedApplications();
  }

  @Get("admin/applications/:application")
  @UseGuards(AdminGuard)
  async getApplication(@Param("application") applicationId: number) {
    return await this.applications.getApplication(applicationId);
  }

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
