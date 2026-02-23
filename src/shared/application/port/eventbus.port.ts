import type { EventType } from "../enum/event.enum.js";

interface EventDetails {
	eventName: EventType;
	occurredAt: Date;
	payload: any;
}

interface EventBus {
	emit(event: EventDetails): Promise<void>;
	subscribe(
		eventName: EventType,
		handler: (event: EventDetails) => Promise<void>,
	): void;
}

export type { EventBus, EventDetails };

