import type { EmailServicePort } from "../../application/port/emailService.port.js";
import nodemailer from "nodemailer";

class EmailServiceAdapter implements EmailServicePort{
    private readonly transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "localhost",
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        } : undefined,
    });

    async sendTo(recipientEmail: string, message: string): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "no-reply@localhost",
            to: recipientEmail,
            subject: "Notification",
            text: "You have a new notification.",
        });
    }
} 

export default EmailServiceAdapter;
