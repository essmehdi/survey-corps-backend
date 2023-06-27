import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { FormConfigService } from "../config/config.service";

@Injectable()
export class UnpublishedFormGuard implements CanActivate {
  constructor(private config: FormConfigService) {}

  async canActivate() {
    return !(await this.config.isFormPublished());
  }
}
