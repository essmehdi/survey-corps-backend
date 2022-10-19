import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AddSectionDto } from '../dto/AddSectionDto';
import { SectionsService } from './sections.service';

@Controller('sections')
export class SectionsController {

  constructor (private sections: SectionsService) {}

  @Get(':section')
  async getSection(@Param('section') sectionId: number) {
    return await this.sections.section(sectionId);
  }

  @Post()
  async addSection(@Body() addSectionDto: AddSectionDto) {
    await this.sections.addSection(addSectionDto.title);
    return {
      message: "Section added succesfully"
    }
  }

  @Delete(':section')
  async deleteSection(@Param() section: number) {
    await this.sections.deleteSection(section);
    return {
      message: "Section deleted successfully"
    };
  }
}
