import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AddSectionDto } from '../dto/AddSectionDto';
import { ChangeNextSectionDto, NextSectionType } from '../dto/ChangeNextSectionDto';
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
  async deleteSection(@Param('section') section: number) {
    await this.sections.deleteSection(section);
    return {
      message: "Section deleted successfully"
    };
  }

  @Patch(':section/next')
  async nextSection(@Param('section') section: number, @Body() changeNextSectionDto: ChangeNextSectionDto) {
    if (changeNextSectionDto.type === NextSectionType.SECTION) {
      await this.sections.setSectionNext(section, changeNextSectionDto.section);
    } else if (changeNextSectionDto.type === NextSectionType.CONDITION) {
      await this.sections.setConditionNext(section, changeNextSectionDto.condition);
    }
  }
}
