import { IsNotEmpty, IsString } from "class-validator";

export class AddSectionDto {
  /**
   * Section title
   */
  @IsString()
  @IsNotEmpty()
  title: string;
}
