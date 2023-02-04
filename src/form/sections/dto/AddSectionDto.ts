import { IsNotEmpty, IsString } from "class-validator";

export class AddSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}