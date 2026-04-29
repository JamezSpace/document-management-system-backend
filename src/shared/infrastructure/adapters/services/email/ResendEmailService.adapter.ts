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
	): Promise<boolean> {
        let numOfRetries = 0;
		let subject =
			type === "notif"
				? "Notification"
				: "Activation of Your Nexus-Fons Digital Office Account";

        const messageType = type;
        const { recipientEmail, message } = payload;
		const { data, error } = await this.resend.emails.send({
			from: "onboarding@resend.dev",
			to: recipientEmail,
			subject,
			html: message,
		});

		if (error) {
			console.error("Resend error:", error);

            if(numOfRetries > 3)
			    throw new Error("Email sending failed");
            
            await this.sendTo({ recipientEmail, message }, messageType);
            numOfRetries++;
		}

		console.log("Resend success:", data);
        return true;
	}
}

export default ResendEmailServiceAdapter;
