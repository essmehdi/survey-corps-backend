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

  @Patch(':application/accept')
  async acceptApplication(@Param('application') applicationId: number) {
    return await this.applications.respondToApplication(applicationId, 'GRANTED');
  }

  @Patch(':application/reject')
  async rejectApplication(@Param('application') applicationId: number) {
    return await this.applications.respondToApplication(applicationId, 'REJECTED');
  }
}
