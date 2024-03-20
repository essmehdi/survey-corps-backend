import { UserPublicDto } from "./user-public.dto";

export class UserAdminDto extends UserPublicDto {
  registered: boolean;
}
