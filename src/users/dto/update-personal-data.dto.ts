import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdatePersonalDataDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstname: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastname: string;
}
