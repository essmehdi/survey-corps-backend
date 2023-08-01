import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePersonalDataDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  firstname: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  lastname: string;
}
