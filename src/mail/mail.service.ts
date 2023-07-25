import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Application } from "@prisma/client";
import { readFile, readFileSync } from "fs";
import Handlebars from "handlebars";
import * as nodemailer from "nodemailer";
import { join } from "path";
import * as TakeoutClient from "takeout.js";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly config: ConfigService) {}

  async sendApplicationApproved(
    email: string,
    fullname: string,
    token: string
  ) {
    const formLink = this.config.get("FRONTEND_URL") + "/form/" + token;

    const html = this.getPopulatedTemplate("application-approved.html", {
      url: formLink,
      fullname
    });

    this.sendTakeoutEmail(email, "Survey form application approved", html);
  }

  async sendRegistrationEmail(email: string, fullname: string, token: string) {
    const registrationLink =
      this.config.get("FRONTEND_URL") + "/register/" + token;

    const html = this.getPopulatedTemplate("registration.html", {
      url: registrationLink,
      fullname
    });

    this.sendTakeoutEmail(email, "Registration link", html);
  }

  async sendPasswordResetEmail(email: string, fullname: string, token: string) {
    const resetLink = this.config.get("FRONTEND_URL") + "/reset/" + token;

    const html = this.getPopulatedTemplate("password-reset.html", {
      url: resetLink,
      fullname
    });

    this.sendTakeoutEmail(email, "Password reset link", html);
  }

  private getPopulatedTemplate(
    templateName: string,
    context: Record<string, any>
  ): string {
    const source = readFileSync(
      join(__dirname, "templates", templateName)
    ).toString();
    const template = Handlebars.compile(source);

    return template({
      ...context,
      bridgeImageUrl: this.config.get("API_URL") + "/bridge-email.png"
    });
  }

  /**
   * Sends email using Takeout API
   * @param email Recipient email
   * @param subject Email subject
   * @param html Email HTML body
   */
  private async sendTakeoutEmail(email: string, subject: string, html: string) {
    const takeoutClient = new TakeoutClient();
    takeoutClient.login(this.config.get("TAKEOUT_TOKEN"));
    const response = await takeoutClient.send({
      to: email,
      from: "ENSIAS Bridge",
      subject,
      html
    });
    this.logger.log("Takeout email sent: " + response.id);
  }
}
