import { transporter } from "../configs/mailer";
import { logger } from "../configs/logger";
import { config } from "../configs/config";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  try {
    const mailOptions = {
      from: config.SMTP.MAIL_FROM, // sender address from .env
      to, // recipient
      subject, // mail subject
      html, // mail content (HTML template)
    };

    const info = await transporter.sendMail(mailOptions);

    // Success log
    logger.info(
      `Email sent successfully to ${to} | MessageID: ${info.messageId}`
    );

    return info;
  } catch (error: any) {
    // Error log
    logger.error(`Failed to send email to ${to} | Error: ${error.message}`);

    throw error; // rethrow so controller/service can handle
  }
};
