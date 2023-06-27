import { Injectable } from "@nestjs/common";
import { NotifierService } from "src/notifier/notifier.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FormConfigService {
  constructor(
    private prisma: PrismaService,
    private notifier: NotifierService
  ) {
    this.initializeConfig();
  }

  private async initializeConfig() {
    const configCount = await this.prisma.formConfig.count();
    if (configCount === 0) {
      await this.prisma.formConfig.createMany({
        data: [
          {
            key: "published",
            value: "false"
          }
        ]
      });
    }
  }

  /**
   * Gets the value of a config key
   * @param key The key to get the value of
   */
  private async getConfig(key: string) {
    return await this.prisma.formConfig.findFirst({
      where: { key }
    });
  }

  /**
   * Checks if the form is published
   */
  async isFormPublished() {
    const published = await this.getConfig("published");
    return published.value === "true";
  }

  /**
   * Makes the form published or unpublished
   */
  async changeFormPublishState(publish: boolean) {
    const published = await this.isFormPublished();
    if (published === publish) return;
    await this.prisma.formConfig.update({
      where: { key: "published" },
      data: { value: publish ? "true" : "false" }
    });
    this.notifier.addEvent("formConfigChange", await this.getAllConfig());
  }

  /**
   * Get the config as an object
   */
  async getAllConfig() {
    const config = await this.prisma.formConfig.findMany();
    const configObject = {};
    for (const item of config) {
      configObject[item.key] = item.value;
    }
    return configObject;
  }
}
