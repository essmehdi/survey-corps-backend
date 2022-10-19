import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AddQuestionDto } from "./AddQuestionDto";

export class EditQuestionDto extends AddQuestionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;
}