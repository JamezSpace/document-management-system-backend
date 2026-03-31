import { Resend } from "resend";
import type { GlobalEmailServicePort } from "../../../../application/port/services/emailService.port.js";

class ResendEmailServiceAdapter implements GlobalEmailServicePort {
	resend: Resend;

	constructor() {
		this.resend = new Resend(process.env.resend_api_key);
	}

	async sendTo(
  payload: { recipientEmail: string; message: string },
  type: "onboarding" | "notif",
): Promise<void> {
  let subject =
    type === "notif"
      ? "Notification"
      : "Activation of Your Nexus-Fons Digital Office Account";

  const { data, error } = await this.resend.emails.send({
    from: "onboarding@resend.dev",
    to: payload.recipientEmail,
    subject,
    html: payload.message,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Email sending failed"); // <-- don't swallow
  }

  console.log("Resend success:", data);
}
}

export default ResendEmailServiceAdapter;
