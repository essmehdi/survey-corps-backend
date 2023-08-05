import { IsNotEmpty, IsOptional, IsString, Max, MaxLength } from "class-validator";

export class AddSectionDto {
  /**
   * Section title
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  /**
   * Section description
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
