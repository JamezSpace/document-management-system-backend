import type { EventBus } from "../../../shared/application/EventBus.js";
import { EventTypes } from "../../../shared/application/types/EventTypes.js";
import type { Action } from "../../domain/IdentityState.js";
import type { AuthorizationResource } from "../../application/types/AuthorizationResource.type.js";
import type { IdentityEventsPort } from "../../application/ports/IdentityEvents.port.js";



/**
 * This is a wrapper class implementation of the identity & authority event types. This class establishes communication between the subsystem and the eventBus
 */
class IdentityEventAdapter implements IdentityEventsPort {
    private readonly eventBus: EventBus

    constructor(private eventBusInstance: EventBus) {
        this.eventBus = eventBusInstance;
    }

    async userAuthenticated(payload: { userId: string; roles: string[] }): Promise<void> {
        await this.eventBus.emit({
            eventName: EventTypes.USER_AUTHENTICATED,
            occurredAt: new Date(),
            payload: {
                userId: payload.userId,
                roles: payload.roles
            }
        })
    }

    async authorizationDenied(payload: { userId: string; action: Action; resource: AuthorizationResource; }): Promise<void> {
        await this.eventBus.emit({
            eventName: EventTypes.AUTHORIZATION_DENIED,
            occurredAt: new Date(),
            payload: {
                userId: payload.userId,
                action: payload.action,
                resource: payload.resource
            }
        })
    }

    async authorizationGranted(payload: { userId: string; action: Action; resource: AuthorizationResource; }): Promise<void> {
        await this.eventBus.emit({
            eventName: EventTypes.AUTHORIZATION_GRANTED,
            occurredAt: new Date(),
            payload: {
                userId: payload.userId,
                action: payload.action,
                resource: payload.resource
            }
        })
    }
}

export default IdentityEventAdapter;
