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
    const source = readFileSync(
      join(__dirname, "templates", "applicarion-approved.html")
    ).toString();
    const template = Handlebars.compile(source);
    const html = template({ url: formLink, fullname });

    const takeoutClient = new TakeoutClient();
    takeoutClient.login(this.config.get("TAKEOUT_TOKEN"));
    const response = await takeoutClient.send({
      to: email,
      from: "ENSIAS Bridge",
      subject: "Survey form application approved",
      html
    });
    this.logger.log("Registration email sent: " + response.id);
  }

  async sendRegistrationEmail(email: string, fullname: string, token: string) {
    const registrationLink =
      this.config.get("FRONTEND_URL") + "/register/" + token;
    const source = readFileSync(
      join(__dirname, "templates", "registration.html")
    ).toString();
    const template = Handlebars.compile(source);
    const html = template({ url: registrationLink, fullname });

    const takeoutClient = new TakeoutClient();
    takeoutClient.login(this.config.get("TAKEOUT_TOKEN"));
    const response = await takeoutClient.send({
      to: email,
      from: "ENSIAS Bridge",
      subject: "Registration link",
      html
    });
    this.logger.log("Registration email sent: " + response.id);
  }
}
