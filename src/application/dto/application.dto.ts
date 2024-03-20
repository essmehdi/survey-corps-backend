import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { ApplicationStatus, Application } from "@prisma/client";
import { Exclude } from "class-transformer";

export class ApplicationDto implements Application {
  id: number;
  fullname: string;
  email: string;
  createdAt: Date;

  @ApiProperty({
    enum: ApplicationStatus
  })
  status: ApplicationStatus;

  @Exclude()
  @ApiHideProperty()
  tokenId: number;
}
