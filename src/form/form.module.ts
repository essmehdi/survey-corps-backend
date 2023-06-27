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
import { TokensModule } from "src/tokens/tokens.module";
import { FormConfigService } from "./config/config.service";
import { NotifierModule } from "src/notifier/notifier.module";

@Module({
  providers: [
    QuestionsService,
    AnswersService,
    SectionsService,
    SubmissionsService,
    FormConfigService
  ],
  controllers: [
    QuestionsController,
    SectionsController,
    AnswersController,
    SubmissionsController,
    SessionController
  ],
  imports: [TokensModule, NotifierModule]
})
export class FormModule {}
