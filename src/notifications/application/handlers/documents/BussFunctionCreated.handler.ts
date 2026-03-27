import type { EventDetails } from "../../../../shared/application/port/services/eventbus.port.js";
import { NotificationPriority } from "../../../domain/enum/NotificationPriority.enum.js";
import { NotificationRecipientType } from "../../../domain/enum/NotificationRecipientType.enum.js";
import type CreateNotificationUseCase from "../../usecase/CreateNotification.usecase.js";

class BusinessFunctionCreatedHandler {
	constructor(
		private readonly createNotification: CreateNotificationUseCase,
	) {}

	async handle(ev: EventDetails) {
		const { businessFunction, actorId } = ev.payload;

		const subjectType = "BUSINESS_FUNCTION";

		await this.createNotification.create({
			actorId,
			recipientId: "ADMIN",
			recipientType: NotificationRecipientType.ROLE,
			priority: NotificationPriority.LOW,
			eventType: ev.eventName,
			subjectType: "BUSINESS_FUNCTION",
			subjectId: businessFunction.id,
			subjectName: businessFunction.name,
			payload: ev.payload,
		});
	}
}

export default BusinessFunctionCreatedHandler;
