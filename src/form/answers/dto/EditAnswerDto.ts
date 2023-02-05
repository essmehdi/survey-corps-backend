import { IsOptional, IsString } from "class-validator";
import { AddAnswerDto } from "./AddAnswerDto";

export class EditAnswerDto extends AddAnswerDto {
  @IsOptional()
  title: string;
}
