import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { AddSectionDto } from "./dto/AddSectionDto";
import {
  ChangeNextSectionDto,
  NextSectionType
} from "./dto/ChangeNextSectionDto";
import { SectionsService } from "./sections.service";

@ApiTags("Admin form", "Sections")
@Controller("admin/sections")
@UseGuards(AdminGuard)
export class SectionsController {
  constructor(private sections: SectionsService) {}

  @Get()
  async getAllSections() {
    // return await this.sections.allSections();
    return await this.sections.allSectionsWithOrderedQuestions();
  }

  @Get(":section")
  async getSection(@Param("section") sectionId: number) {
    return await this.sections.section(sectionId);
  }

  @Post()
  async addSection(@Body() addSectionDto: AddSectionDto) {
    await this.sections.addSection(addSectionDto.title);
    return {
      message: "Section added succesfully"
    };
  }

  @Delete(":section")
  async deleteSection(@Param("section") section: number) {
    await this.sections.deleteSection(section);
    return {
      message: "Section deleted successfully"
    };
  }

  @Post(":section/next")
  async nextSection(
    @Param("section") section: number,
    @Body() changeNextSectionDto: ChangeNextSectionDto
  ) {
    if (changeNextSectionDto.type === NextSectionType.SECTION) {
      return await this.sections.setSectionNext(
        section,
        changeNextSectionDto.section
      );
    } else if (changeNextSectionDto.type === NextSectionType.CONDITION) {
      return await this.sections.setConditionNext(
        section,
        changeNextSectionDto.condition
      );
    }
  }
}
