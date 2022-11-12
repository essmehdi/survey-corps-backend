import { Module } from '@nestjs/common';
import { QuestionsService } from './questions/questions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnswersService } from './answers/answers.service';
import { SectionsService } from './sections/sections.service';
import { QuestionsController } from './questions/questions.controller';
import { SectionsController } from './sections/sections.controller';
import { AnswersController } from './answers/answers.controller';

@Module({
  providers: [QuestionsService, AnswersService, SectionsService],
  controllers: [QuestionsController, SectionsController, AnswersController]
})
export class FormModule {}
