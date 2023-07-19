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

    await this.prisma.$transaction(async (tx) => {
      await this.prisma.formConfig.update({
        where: { key: "published" },
        data: { value: publish ? "true" : "false" }
      });
      if (!publish) await tx.submission.deleteMany();
      this.notifier.addEvent("formConfigChange", await this.getAllConfig());
    });
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
    // Validate sections
    const allSections = await this.prisma.questionSection.findMany({
      include: { questions: true }
    });
    if (allSections.length === 0) {
      throw new BadRequestException("Form is empty");
    }
    const emptySection = allSections.find(
      (section) => section.questions.length === 0
    );
    if (emptySection) {
      throw new BadRequestException(`Section #${emptySection.id} is empty`);
    }

    const section = await this.prisma.questionSection.findFirst({
      where: {
        AND: [
          { nextSectionId: null },
          { questions: { some: { conditions: { none: {} } } } }
        ]
      }
    });
    if (!section) {
      throw new BadRequestException("There is no exiting section");
    }

    // Validate questions
    const allQuestions = await this.prisma.question.findMany({
      include: {
        answers: true,
        conditions: true
      }
    });
    for (const question of allQuestions) {
      if (question.type !== "FREEFIELD" && question.answers.length === 0) {
        return {
          valid: false,
          reason: `Question #${question.id} in section #${question.sectionId} is a choice question and must have answers`
        };
      }
      if (
        question.conditions.length > 0 &&
        question.conditions.length !== question.answers.length
      ) {
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
