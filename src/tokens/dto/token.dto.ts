import { ApiHideProperty } from "@nestjs/swagger";
import { Token } from "@prisma/client";
import { Exclude } from "class-transformer";

export class TokenDto implements Token {
  id: number;
  token: string;
  createdAt: Date;
  submitted: boolean;

  @Exclude()
  @ApiHideProperty()
  userId: number;
}
