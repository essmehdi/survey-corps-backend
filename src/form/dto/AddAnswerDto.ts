import { IsNumber, IsString } from "class-validator";

export class AddAnswerDto {
  @IsString()
  title: string;
}