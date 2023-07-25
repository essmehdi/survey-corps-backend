import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
    const { status, page, limit } = getApplicationsDto;
    return await this.applications.getApplications(status, page, limit);
  }

  /**
   * Gets one application
   */
  @Get("admin/applications/:application")
  @UseGuards(AdminGuard)
  async getApplication(
    @Param("application", ParseIntPipe) applicationId: number
  ) {
    return await this.applications.getApplication(applicationId);
  }

  /**
   * Accepts an application
   */
  @Post("admin/applications/:application/accept")
  @UseGuards(AdminGuard)
  async acceptApplication(
    @Param("application", ParseIntPipe) applicationId: number
  ) {
    return await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.GRANTED
    );
  }

  /**
   * Rejects an application
   */
  @Post("admin/applications/:application/reject")
  @UseGuards(AdminGuard)
  async rejectApplication(
    @Param("application", ParseIntPipe) applicationId: number
  ) {
    return await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.REJECTED
    );
  }
}
