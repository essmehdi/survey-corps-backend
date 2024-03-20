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

  /**
   * Send an approval message to the applicant
   * @param email The applicant's email
   * @param fullname The applicant's fullname
   * @param token The token to be used to access the form
   */
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

  /**
   * Send a registration link to the newly added user to complete his registration
   * @param email The new user's email
   * @param firstname The new user's firstname
   * @param token The token to be used to register the user
   */
  async sendRegistrationEmail(email: string, firstname: string, token: string) {
    const registrationLink =
      this.config.get("FRONTEND_URL") + "/register/" + token;

    const html = this.getPopulatedTemplate("registration.html", {
      url: registrationLink,
      firstname
    });

    this.sendEmail(email, "Registration link", html);
  }

  /**
   * Send a password reset link to the user
   * @param email The user's email
   * @param firstname The user's firstname
   * @param token The token to be used to reset the password
   */
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

  /**
   * Gets a template and populates it with the given context
   * @param templateName The name of the template to be used
   * @param context The context to be used to populate the template
   */
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
      const sentEmail = await this.resend.emails.send({
        to: email,
        from: `ENSIAS Bridge Survey Team <${this.config.get("MAIL_ADDRESS")}>`,
        subject,
        html
      });
      this.logger.log(`Email sent: ${sentEmail.data.id}`);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
