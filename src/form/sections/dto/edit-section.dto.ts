import { IsNotEmpty, IsOptional, IsString, Max, MaxLength } from "class-validator";
import { AddSectionDto } from "./add-section.dto";

export class EditSectionDto {
  /**
   * Section's title
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  /**
   * Section's description
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
