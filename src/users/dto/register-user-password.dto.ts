import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Match } from "src/utils/validators";

export class RegisterUserPasswordDto {
  @IsString()
  @MinLength(10)
  @MaxLength(250)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match("password")
  confirmPassword: string;
}
