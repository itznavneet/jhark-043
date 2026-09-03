import nodemailer, { type Transporter } from "nodemailer";
import type { AppEnvironment } from "../config/environment.js";

type EmailMessage = {
  recipientEmail: string;
  title: string;
  message: string;
};

export class EmailNotificationService {
  private transporter: Transporter | null = null;
  private from: string | null = null;

  configure(environment: AppEnvironment) {
    if (
      !environment.smtpHost ||
      !environment.smtpUser ||
      !environment.smtpPassword ||
      !environment.emailFrom
    ) {
      this.transporter = null;
      this.from = null;
      return;
    }
    this.transporter = nodemailer.createTransport({
      host: environment.smtpHost,
      port: environment.smtpPort ?? 587,
      secure: environment.smtpPort === 465,
      auth: { user: environment.smtpUser, pass: environment.smtpPassword },
    });
    this.from = environment.emailFrom;
  }

  get enabled() {
    return this.transporter !== null && this.from !== null;
  }

  async send(messages: EmailMessage[]): Promise<void> {
    if (!this.transporter || !this.from) return;
    for (const message of messages) {
      if (!isSafeEmailAddress(message.recipientEmail)) continue;
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: message.recipientEmail,
          subject: message.title,
          text: message.message,
        });
      } catch {
        // Email is an optional side effect. Dashboard notifications remain authoritative.
      }
    }
  }
}

function isSafeEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
