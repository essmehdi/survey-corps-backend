import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApplicationService } from "./application.service";
import { CreateApplicationDto } from "./dto/add-application.dto";
import {
  ApplicationsQueryDto,
  StatusOptions
} from "./dto/applications-query.dto";
import { TransformDataInterceptor } from "src/common/interceptors/TransformDataInterceptor";
import { ApplicationDto } from "./dto/application.dto";
import { PaginatedResponseDto } from "src/common/dto/paginated-response.dto";

@ApiTags("Alumni application")
@Controller()
export class ApplicationController {
  constructor(private applications: ApplicationService) {}

  /**
   * Sends an application for the form
   */
  @Post("applications")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(new TransformDataInterceptor(ApplicationDto))
  @ApiOkResponse({
    type: ApplicationDto
  })
  async apply(@Body() applicationDto: CreateApplicationDto) {
    const { fullname, email } = applicationDto;
    return await this.applications.addApplication(fullname, email);
  }

  /**
   * Gets the list of applications
   */
  @Get("admin/applications")
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(ApplicationDto))
  @ApiOkResponse({
    type: ApplicationDto,
    isArray: true
  })
  async getAllApplications(@Query() getApplicationsDto: ApplicationsQueryDto) {
    const { status, page, limit } = getApplicationsDto;
    const [applications, count] = await this.applications.getApplicationsPage(
      status,
      page,
      limit
    );
    return PaginatedResponseDto.from(applications, page, limit, count);
  }

  /**
   * Gets one application
   */
  @Get("admin/applications/:application")
  @UseGuards(AdminGuard)
  @UseInterceptors(new TransformDataInterceptor(ApplicationDto))
  @ApiOkResponse({
    type: ApplicationDto
  })
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
  @UseInterceptors(new TransformDataInterceptor(ApplicationDto))
  @ApiOkResponse({
    type: ApplicationDto
  })
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
  @UseInterceptors(new TransformDataInterceptor(ApplicationDto))
  @ApiOkResponse({
    type: ApplicationDto
  })
  async rejectApplication(
    @Param("application", ParseIntPipe) applicationId: number
  ) {
    return await this.applications.respondToApplication(
      applicationId,
      ApplicationStatus.REJECTED
    );
  }
}
