import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { AddSectionDto } from "./dto/add-section.dto";
import {
  ChangeNextSectionDto,
  NextSectionType
} from "./dto/change-next-section.dto";
import { SectionsService } from "./sections.service";
import { EditSectionDto } from "./dto/edit-section.dto";
import { UnpublishedFormGuard } from "../guards/unpublished-form.guard";
import { EditInterceptor } from "../interceptors/edit.interceptor";
import { TransformDataInterceptor } from "src/misc/interceptors/TransformDataInterceptor";
import { SectionWithQuestionsDto } from "./dto/section-with-questions.dto";
import { SectionDto } from "./dto/section.dto";
import { MessageDto } from "src/misc/dto/message.dto";

@ApiTags("Admin form", "Sections")
@Controller("admin/sections")
@UseGuards(AdminGuard)
@UseGuards(UnpublishedFormGuard)
@UseInterceptors(EditInterceptor)
export class SectionsController {
  constructor(private sections: SectionsService) {}

  /**
   * Gets all the sections
   */
  @Get()
  @UseInterceptors(new TransformDataInterceptor(SectionWithQuestionsDto))
  @ApiOkResponse({
    type: SectionWithQuestionsDto,
    isArray: true
  })
  async getAllSections() {
    return await this.sections.allSectionsWithOrderedQuestions();
  }

  /**
   * Gets a section by ID
   */
  @Get(":section")
  @UseInterceptors(new TransformDataInterceptor(SectionWithQuestionsDto))
  @ApiOkResponse({
    type: SectionWithQuestionsDto
  })
  async getSection(@Param("section", ParseIntPipe) sectionId: number) {
    return await this.sections.section(sectionId);
  }

  /**
   * Adds a section
   */
  @Post()
  @UseInterceptors(new TransformDataInterceptor(SectionDto))
  @ApiOkResponse({
    type: SectionDto
  })
  async addSection(@Body() addSectionDto: AddSectionDto) {
    return await this.sections.addSection(
      addSectionDto.title,
      addSectionDto.description
    );
  }

  /**
   * Edits a section
   */
  @Patch(":section")
  @UseInterceptors(new TransformDataInterceptor(SectionDto))
  @ApiOkResponse({
    type: SectionDto
  })
  async editSection(
    @Param("section", ParseIntPipe) sectionId: number,
    @Body() editSectionDto: EditSectionDto
  ) {
    return await this.sections.editSection(
      sectionId,
      editSectionDto.title,
      editSectionDto.description
    );
  }

  /**
   * Deletes a section
   */
  @Delete(":section")
  async deleteSection(
    @Param("section", ParseIntPipe) section: number
  ): Promise<MessageDto> {
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
    @Param("section", ParseIntPipe) section: number,
    @Body() changeNextSectionDto: ChangeNextSectionDto
  ): Promise<MessageDto> {
    if (changeNextSectionDto.type === NextSectionType.SECTION) {
      await this.sections.setSectionNext(section, changeNextSectionDto.section);
    } else if (changeNextSectionDto.type === NextSectionType.CONDITION) {
      await this.sections.setConditionNext(
        section,
        changeNextSectionDto.condition
      );
    }
    return {
      message: "Successfully set next section"
    };
  }
}
