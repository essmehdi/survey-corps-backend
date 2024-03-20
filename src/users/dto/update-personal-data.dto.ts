import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePersonalDataDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  firstname?: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  lastname?: string;
}
