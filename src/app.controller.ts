import { Controller, Get, Redirect } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("Welcome")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect("/api")
  getHello(): string {
    return this.appService.getHello();
  }
}
