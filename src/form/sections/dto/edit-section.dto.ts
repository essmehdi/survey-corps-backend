import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AddSectionDto } from "./add-section.dto";

export class EditSectionDto {
  /**
   * Section's title
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  /**
   * Section's description
   */
  @IsString()
  @IsOptional()
  description?: string;
}
