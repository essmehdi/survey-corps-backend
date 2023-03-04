import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AddSectionDto } from "./add-section.dto";

export class EditSectionDto extends AddSectionDto {
  /**
   * Section's title
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;
}
