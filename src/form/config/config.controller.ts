import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { FormConfigService } from "./config.service";
import { AdminGuard } from "src/auth/guards/admin.guard";

@Controller("admin/config")
@UseGuards(AdminGuard)
export class FormConfigController {
  constructor(private config: FormConfigService) {}

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

  @Post("toggle-publish")
  async togglePublishForm() {
    await this.config.changeFormPublishState(
      !(await this.config.isFormPublished())
    );
    return {
      message: "Toggled form state successfully"
    };
  }

  @Get()
  async getConfig() {
    return await this.config.getAllConfig();
  }
}
