import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { join } from "path";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get("RESEND_API_KEY"));
  }

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

    this.sendEmail(email, "Survey form application approved", html);
  }

  async sendRegistrationEmail(email: string, firstname: string, token: string) {
    const registrationLink =
      this.config.get("FRONTEND_URL") + "/register/" + token;

    const html = this.getPopulatedTemplate("registration.html", {
      url: registrationLink,
      firstname
    });

    this.sendEmail(email, "Registration link", html);
  }

  async sendPasswordResetEmail(
    email: string,
    firstname: string,
    token: string
  ) {
    const resetLink = this.config.get("FRONTEND_URL") + "/reset/" + token;

    const html = this.getPopulatedTemplate("password-reset.html", {
      url: resetLink,
      firstname
    });

    this.sendEmail(email, "Password reset link", html);
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
   * Sends email
   * @param email Recipient email
   * @param subject Email subject
   * @param html Email HTML body
   */
  private async sendEmail(email: string, subject: string, html: string) {
    try {
      const data = await this.resend.emails.send({
        to: email,
        from: `ENSIAS Bridge Survey Team <${this.config.get("MAIL_ADDRESS")}>`,
        subject,
        html
      });
      this.logger.log(`Email sent: ${data.id}`);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
