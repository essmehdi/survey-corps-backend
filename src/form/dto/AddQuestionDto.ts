import { QuestionType } from "@prisma/client";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { AddAnswerDto } from "./AddAnswerDto";

export class AddQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsBoolean()
  required: boolean;

  @ValidateIf(o => o.type !== 'FREEFIELD')
  @IsBoolean()
  hasOther: boolean;

  // @ValidateIf(o => o.type !== 'FREEFIELD')
  // @IsArray()
  // @ValidateNested({ each: true })
  // @ArrayNotEmpty()
  // answers: AddAnswerDto[];
}