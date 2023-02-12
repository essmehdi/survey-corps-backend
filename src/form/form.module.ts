import { Module } from "@nestjs/common";
import { QuestionsService } from "./questions/questions.service";
import { AnswersService } from "./answers/answers.service";
import { SectionsService } from "./sections/sections.service";
import { QuestionsController } from "./questions/questions.controller";
import { SectionsController } from "./sections/sections.controller";
import { AnswersController } from "./answers/answers.controller";
import { SubmissionsController } from "./submissions/submissions.controller";
import { SubmissionsService } from "./submissions/submissions.service";
import { SessionController } from "./session/session.controller";
import { UnusedTokenGuard } from "src/tokens/guards/unusedToken.guard";

@Module({
  providers: [
    QuestionsService,
    AnswersService,
    SectionsService,
    SubmissionsService
  ],
  controllers: [
    QuestionsController,
    SectionsController,
    AnswersController,
    SubmissionsController,
    SessionController
  ],
  imports: [UnusedTokenGuard]
})
export class FormModule {}
