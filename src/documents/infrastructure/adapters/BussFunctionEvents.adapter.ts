import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../shared/application/port/eventbus.port.js";
import type { BusinessFunctionEventsPort } from "../../application/ports/events/BusinessFunctionEvents.port.js";

class BusinessFunctionEventsAdapter implements BusinessFunctionEventsPort {
	constructor(private readonly eventBus: EventBus) {}

	async businessFunctionCreated(payload: {
		businessFunction: {
			id: string;
			name: string;
		};
		actorId: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName:
				GlobalEventTypes.document.business_function
					.BUSS_FUNCTION_CREATED,
			occurredAt: new Date(),
			payload,
		});
	}
}

export default BusinessFunctionEventsAdapter;
