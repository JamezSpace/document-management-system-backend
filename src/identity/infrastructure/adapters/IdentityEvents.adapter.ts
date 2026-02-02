import type { EventBus } from "../../../shared/application/EventBus.js";
import { EventTypes } from "../../../shared/application/types/EventTypes.js";
import type { ActionToBeAuthorized } from "../../domain/authorization/types/ActionToBeAuthorized.js";
import type { AuthorizationResource } from "../../application/types/AuthorizationResource.type.js";
import type { IdentityEventsPort } from "../../application/ports/IdentityEvents.port.js";

/**
 * This is a wrapper class implementation of the identity & authority event types. This class establishes communication between the subsystem and the eventBus
 */
class IdentityEventAdapter implements IdentityEventsPort {
	private readonly eventBus: EventBus;

	constructor(private eventBusInstance: EventBus) {
		this.eventBus = eventBusInstance;
	}

	async userAuthenticated(payload: {
		userId: string;
		roles: string[];
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: EventTypes.USER_AUTHENTICATED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
				roles: payload.roles,
			},
		});
	}

	async implicitAuthorizationGranted(payload: {
		userId: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: EventTypes.AUTHORIZATION_GRANTED,
			occurredAt: new Date(),
			payload: {
				type: "implicit",
				userId: payload.userId,
			},
		});
	}

	async implicitAuthorizationDenied(payload: {
		userId: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: EventTypes.AUTHORIZATION_DENIED,
			occurredAt: new Date(),
			payload: {
				type: "implicit",
				userId: payload.userId,
			},
		});
	}

	async contextualAuthorizationGranted(payload: {
		userId: string;
		action: ActionToBeAuthorized;
		resource: AuthorizationResource;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: EventTypes.AUTHORIZATION_GRANTED,
			occurredAt: new Date(),
			payload: {
				type: "contextual",
				userId: payload.userId,
				action: payload.action,
				resource: payload.resource,
			},
		});
	}

	async contextualAuthorizationDenied(payload: {
		userId: string;
		action: ActionToBeAuthorized;
		resource: AuthorizationResource;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: EventTypes.AUTHORIZATION_GRANTED,
			occurredAt: new Date(),
			payload: {
				type: "contextual",
				userId: payload.userId,
				action: payload.action,
				resource: payload.resource,
			},
		});
	}
}

export default IdentityEventAdapter;
