import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AddSubmissionDto } from "./dto/add-submission.dto";
import { SubmissionsService } from "./submissions.service";
import { PublishedFormGuard } from "../common/guards/published-form.guard";
import { MessageDto } from "src/common/dto/message.dto";

@ApiTags("Form submission")
@Controller("submissions")
@UseGuards(PublishedFormGuard)
export class SubmissionsController {
  constructor(private submissions: SubmissionsService) {}

  /**
   * Saves a form submission
   */
  @Post("submit")
  async submit(
    @Body() addSubmissionDto: AddSubmissionDto
  ): Promise<MessageDto> {
    await this.submissions.addSubmission(addSubmissionDto);
    return {
      message: "Submission saved successfully"
    };
  }
}
