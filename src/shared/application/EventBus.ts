import type { EventTypes } from "./types/EventTypes.js";

interface EventDetails {
	eventName: EventTypes;
	occurredAt: Date;
	payload: any;
}

interface EventBus {
	emit(event: EventDetails): Promise<void>;
	subscribe(
		eventName: EventTypes,
		handler: (event: EventDetails) => Promise<void>,
	): void;
}

export type { EventDetails, EventBus };
