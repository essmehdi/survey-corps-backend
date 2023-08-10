import { ApiHideProperty } from "@nestjs/swagger";
import { $Enums, Privilege, User } from "@prisma/client";
import { Exclude, Expose, Transform } from "class-transformer";

export class LeaderboardMember implements User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;

  @Expose()
  @Transform(({ obj }) => obj._count.tokens)
  submissions: number;

  @Exclude()
  @ApiHideProperty()
  profilePicture: Buffer;

  @Exclude()
  @ApiHideProperty()
  password: string;

  @Exclude()
  @ApiHideProperty()
  privilege: Privilege;

  @Exclude()
  @ApiHideProperty()
  isActive: boolean;

  @Exclude()
  @ApiHideProperty()
  registered: string;

  @Exclude()
  @ApiHideProperty()
  _count: any;
}
