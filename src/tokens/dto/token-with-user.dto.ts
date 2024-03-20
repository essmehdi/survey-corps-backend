import { UserPublicDto } from "src/users/dto/user-public.dto";
import { TokenDto } from "./token.dto";
import { Exclude, Expose, Type } from "class-transformer";
import { Privilege, User } from "@prisma/client";
import { ApiHideProperty } from "@nestjs/swagger";

@Exclude()
class TokenUser implements User {
  @Expose()
  id: number;

  @Expose()
  firstname: string;

  @Expose()
  lastname: string;

  @Expose()
  email: string;

  @ApiHideProperty()
  profilePicture: Buffer;

  @ApiHideProperty()
  password: string;

  @ApiHideProperty()
  privilege: Privilege;

  @ApiHideProperty()
  isActive: boolean;
}

export class TokenWithUserDto extends TokenDto {
  @Type(() => TokenUser)
  user?: TokenUser;
}
