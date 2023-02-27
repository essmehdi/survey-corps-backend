import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export enum PrivilegeFilter {
  ALL = "ALL",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export class UsersQueryDto {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page: number;

  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  limit: number;

  @IsEnum(PrivilegeFilter)
  @IsOptional()
  privilege: PrivilegeFilter;

  @IsString()
  @IsOptional()
  search: string;
}
