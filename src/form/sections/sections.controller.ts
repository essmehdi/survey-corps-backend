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
import { AddSectionDto } from "./dto/add-section.dto";
import {
  ChangeNextSectionDto,
  NextSectionType
} from "./dto/change-next-section.dto";
import { SectionsService } from "./sections.service";
import { EditSectionDto } from "./dto/edit-section.dto";

@ApiTags("Admin form", "Sections")
@Controller("admin/sections")
@UseGuards(AdminGuard)
export class SectionsController {
  constructor(private sections: SectionsService) {}

  /**
   * Gets all the sections
   */
  @Get()
  async getAllSections() {
    // return await this.sections.allSections();
    return await this.sections.allSectionsWithOrderedQuestions();
  }

  /**
   * Gets a section by ID
   */
  @Get(":section")
  async getSection(@Param("section") sectionId: number) {
    return await this.sections.section(sectionId);
  }

  /**
   * Adds a section
   */
  @Post()
  async addSection(@Body() addSectionDto: AddSectionDto) {
    await this.sections.addSection(addSectionDto.title);
    return {
      message: "Section added succesfully"
    };
  }

  /**
   * Edits a section
   */
  @Patch(":section")
  async editSection(
    @Param("section") sectionId: number,
    @Body() editSectionDto: EditSectionDto
  ) {
    return await this.sections.editSection(sectionId, editSectionDto.title);
  }

  /**
   * Deletes a section
   */
  @Delete(":section")
  async deleteSection(@Param("section") section: number) {
    await this.sections.deleteSection(section);
    return {
      message: "Section deleted successfully"
    };
  }

  /**
   * Changes the next section of another
   */
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
