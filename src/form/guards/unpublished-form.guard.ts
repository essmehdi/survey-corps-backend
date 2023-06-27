import {
  CanActivate,
  ForbiddenException,
  HttpStatus,
  Injectable
} from "@nestjs/common";
import { FormConfigService } from "../config/config.service";

@Injectable()
export class UnpublishedFormGuard implements CanActivate {
  constructor(private config: FormConfigService) {}

  async canActivate() {
    const isFormPublished = await this.config.isFormPublished();
    if (!isFormPublished) return true;
    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      message: "You cannot modify the form while it is published"
    });
  }
}
