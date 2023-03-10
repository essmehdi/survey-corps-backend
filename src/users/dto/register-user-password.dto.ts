import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { Match } from "src/utils/validators";

export class RegisterUserPasswordDto {
  @IsString()
  @MinLength(10)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match("password")
  confirmPassword: string;
}
