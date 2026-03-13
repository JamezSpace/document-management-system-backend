import type { NotificationIdentityPort } from "../../../shared/application/port/notificationIdentity.port.js";
import type { EmailServicePort } from "../../../shared/application/port/services/emailService.port.js";
import Notification from "../../domain/entities/Notifications.js";

class EmailSenderService {
	constructor(
		private readonly emailService: EmailServicePort,
		private readonly notifIdentity: NotificationIdentityPort,
	) {}

	async send(notification: Notification) {
		const recipient = await this.notifIdentity.getStaffById(notification.recipientId);

		await this.emailService.sendTo(
			recipient.email,
			notification.messageTemplate,
		);
	}
}

export default EmailSenderService;
