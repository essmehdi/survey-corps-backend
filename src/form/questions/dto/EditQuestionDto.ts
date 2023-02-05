import { QuestionType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf
} from "class-validator";

export class EditQuestionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ValidateIf((o) => o.type !== "FREEFIELD")
  @IsBoolean()
  @IsOptional()
  hasOther?: boolean;
}
