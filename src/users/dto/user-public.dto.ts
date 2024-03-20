import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Privilege, User } from "@prisma/client";
import { Exclude, Expose, Transform } from "class-transformer";

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

  @Exclude()
  @ApiHideProperty()
  _count: any;

  @Expose()
  @Transform(({ obj }) => obj._count.tokens)
  submissions: number;
}
