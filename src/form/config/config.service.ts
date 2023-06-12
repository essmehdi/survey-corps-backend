import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {
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
          },
          {
            key: "currentEditorId",
            value: ""
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
  private async isFormPublished() {
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
  }

  /**
   * Gets the current editor ID
   */
  async getCurrentEditorId() {
    const editorId = await this.getConfig("currentEditorId");
    return Number.parseInt(editorId.value);
  }

  /**
   * Sets the current editor ID
   * @param editorId The editor ID to set
   */
  async setCurrentEditorId(editorId: number) {
    await this.prisma.formConfig.update({
      where: { key: "currentEditorId" },
      data: { value: editorId.toString() }
    });
  }
}
