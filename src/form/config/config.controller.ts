import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { FormConfigService } from "./config.service";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { MessageDto } from "src/utils/dto/message.dto";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Form config")
@Controller("admin/config")
@UseGuards(AdminGuard)
export class FormConfigController {
  constructor(private config: FormConfigService) {}

  @Post("publish")
  async publishForm(): Promise<MessageDto> {
    await this.config.changeFormPublishState(true);
    return {
      message: "Form published"
    };
  }

  @Post("unpublish")
  async unpublishForm(): Promise<MessageDto> {
    await this.config.changeFormPublishState(false);
    return {
      message: "Form unpublished"
    };
  }

  @Post("toggle-publish")
  async togglePublishForm(): Promise<MessageDto> {
    await this.config.changeFormPublishState(
      !(await this.config.isFormPublished())
    );
    return {
      message: "Toggled form state successfully"
    };
  }

  @Get()
  @ApiOkResponse({
    type: "object",
    description:
      "An key/value object representing the form config. Currently, there is only the 'published' key."
  })
  async getConfig() {
    return await this.config.getAllConfig();
  }
}
