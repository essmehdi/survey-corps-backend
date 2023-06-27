import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { FormConfigService } from "./config.service";
import { NotifierGateway } from "../../notifier/notifier.gateway";
import { AdminGuard } from "src/auth/guards/admin.guard";

@Controller("admin/config")
@UseGuards(AdminGuard)
export class ConfigController {
  constructor(
    private config: FormConfigService,
    private notifier: NotifierGateway
  ) {}

  @Post("publish")
  async publishForm() {
    await this.config.changeFormPublishState(true);
    return {
      message: "Form published"
    };
  }

  @Post("unpublish")
  async unpublishForm() {
    await this.config.changeFormPublishState(false);
    return {
      message: "Form unpublished"
    };
  }

  @Get()
  async getConfig() {
    return await this.config.getAllConfig();
  }
}
