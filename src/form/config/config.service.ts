import { BadRequestException, Injectable } from "@nestjs/common";
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

    if (publish) {
      // Check form validity before changing status
      const validityResult = await this.validateFormBeforePublish();
      if (!validityResult.valid) {
        throw new BadRequestException(validityResult.reason);
      }
    }

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

  /**
   * Validate the form to detect inconsistencies before publishing the form
   */
  private async validateFormBeforePublish() {
    const allSections = await this.prisma.questionSection.findMany({
      include: { nextSection: true }
    });
    const allQuestions = await this.prisma.question.findMany({
      include: {
        answers: true,
        conditions: true
      }
    });
    const allAnswers = await this.prisma.question.findMany();

    // Validate sections
    for (const section of allSections) {
      if (!section.nextSection) {
        const condition = await this.prisma.condition.findFirst({
          where: {
            question: {
              section: {
                id: section.id
              }
            }
          }
        });

        if (!condition) {
          return {
            valid: false,
            reason: `Section #${section.id} has no direct successor or a conditioned succession`
          };
        }
      }
    }

    // Validate questions
    for (const question of allQuestions) {
      if (question.type !== "FREEFIELD" && question.answers.length === 0) {
        return {
          valid: false,
          reason: `Question #${question.id} in section #${question.sectionId} is of type ${question.type} and must have answers`
        };
      }
      if (question.conditions.length !== question.answers.length) {
        return {
          valid: false,
          reason: `Question #${question.id} in section #${question.sectionId} is conditioned but not all answers have target sections`
        };
      }
    }

    return {
      valid: true
    };
  }
}
