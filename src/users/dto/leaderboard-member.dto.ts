import { Expose, Transform } from "class-transformer";

export class LeaderboardMember {
  firstname: string;
  lastname: string;
  email: string;

  @Transform(({ value }) => value._count.tokens)
  submissions: number;
}
