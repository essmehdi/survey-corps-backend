import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { TokensQueryDto } from "./tokens-query.dto";

export class AllTokensQueryDto extends TokensQueryDto {
  @IsNumber()
  @IsOptional()
  @IsPositive()
  userId: number;
}
