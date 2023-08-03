import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddSectionDto {
  /**
   * Section title
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Section description
   */
  @IsString()
  @IsOptional()
  description?: string;
}
