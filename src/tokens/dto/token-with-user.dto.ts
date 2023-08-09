import { UserPublicDto } from "src/users/dto/user-public.dto";
import { TokenDto } from "./token.dto";
import { Type } from "class-transformer";

export class TokenWithUserDto extends TokenDto {
  @Type(() => UserPublicDto)
  user?: UserPublicDto;
}
