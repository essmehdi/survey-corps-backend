import { QuestionType } from "@prisma/client";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

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

  @IsString()
  @IsOptional()
  regex?: string;

  @IsNumber()
  @ValidateIf((_,v) => v !== null)
  previous: number | null;

  // @ValidateIf(o => o.type !== 'FREEFIELD')
  // @IsArray()
  // @ValidateNested({ each: true })
  // @ArrayNotEmpty()
  // answers: AddAnswerDto[];
}