import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Privilege, User } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";

export class UserPublicDto implements User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;

  @ApiProperty({
    enum: Privilege
  })
  privilege: Privilege;

  isActive: boolean;

  @Exclude()
  @ApiHideProperty()
  profilePicture: Buffer;

  @Exclude()
  @ApiHideProperty()
  password: string;
}
