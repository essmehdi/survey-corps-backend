import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationDto } from './dto/ApplicationDto';

@Controller('applications')
export class ApplicationController {

  constructor (private applications: ApplicationService) {}

  @Post()
  async apply(@Body() applicationDto: ApplicationDto) {
    const { fullname, email } = applicationDto;
    return await this.applications.addApplication(fullname, email);   
  }

  @Get(':application')
  async getApplication(@Param('application') applicationId: number) {
    return await this.applications.getApplication(applicationId);
  }

  @Post(':application/accept')
  async acceptApplication(@Param('application') applicationId: number) {
    await this.applications.respondToApplication(applicationId, 'GRANTED');
    return {
      message: "The application has been successfully accepted"
    };
  }

  @Post(':application/reject')
  async rejectApplication(@Param('application') applicationId: number) {
    await this.applications.respondToApplication(applicationId, 'REJECTED');
    return {
      message: "The application has been successfully rejected"
    };
  }
}
