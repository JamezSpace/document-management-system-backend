import { GlobalEventTypes } from "../../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../../shared/application/port/eventbus.port.js";
import type { IdentityEventsPort } from "../../application/ports/events/IdentityEvents.port.js";

/**
 * This is a wrapper class implementation of the identity & authority event types. This class establishes communication between the subsystem and the eventBus
 */
class IdentityEventsAdapter implements IdentityEventsPort {
	constructor(private readonly eventBus: EventBus) {
	}

	async userAuthenticated(payload: { userId: string }): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.USER_AUTHENTICATED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}

	async userAuthenticationFailed(payload: {
		userId?: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.USER_AUTHENTICATION_FAILED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}

	async userCreated(payload: { userId: string }): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.USER_CREATED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}
}

export default IdentityEventsAdapter;
