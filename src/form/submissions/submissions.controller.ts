import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AddSubmissionDto } from "./dto/add-submission.dto";
import { SubmissionsService } from "./submissions.service";

@ApiTags("Form submission")
@Controller("submissions")
export class SubmissionsController {
  constructor(private submissions: SubmissionsService) {}

  /**
   * Saves a form submission
   */
  @Post("submit")
  async submit(@Body() addSubmissionDto: AddSubmissionDto) {
    return await this.submissions.addSubmission(addSubmissionDto);
  }
}
