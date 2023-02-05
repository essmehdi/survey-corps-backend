import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApplicationStatus } from "@prisma/client";
import { ApplicationService } from "./application.service";
import { ApplicationDto } from "./dto/ApplicationDto";

@Controller("admin/applications")
export class ApplicationController {
  constructor(private applications: ApplicationService) {}

  @Post()
  async apply(@Body() applicationDto: ApplicationDto) {
    const { fullname, email } = applicationDto;
    return await this.applications.addApplication(fullname, email);
  }

  @Get()
  async getAllApplications() {
    return await this.applications.getAllApplications();
  }

  @Get("pending")
  async getAllPendingApplications() {
    return await this.applications.getAllPendingApplications();
  }

  @Get(":application")
  async getApplication(@Param("application") applicationId: number) {
    return await this.applications.getApplication(applicationId);
  }

  @Post(":application/accept")
  async acceptApplication(@Param("application") applicationId: number) {
    await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.GRANTED
    );
    return {
      message: "The application has been successfully accepted"
    };
  }

  @Post(":application/reject")
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
