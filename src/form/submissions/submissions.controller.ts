import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AddSubmissionDto } from "./dto/AddSubmissionDto";
import { SubmissionsService } from "./submissions.service";

@ApiTags("Form submission")
@Controller("submissions")
export class SubmissionsController {
  constructor(private submissions: SubmissionsService) {}

  @Post("submit")
  async submit(@Body() addSubmissionDto: AddSubmissionDto) {
    return await this.submissions.addSubmission(addSubmissionDto);
  }
}
