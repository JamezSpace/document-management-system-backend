import type { Action } from "../../domain/IdentityState.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.type.js";

/**
 * These wraps all events that would get triggered in the identity & authoiry subsystem
 */
interface IdentityEventsPort {
	userAuthenticated(payload: {
        userId: string;
        roles: string[];
    }): Promise<void>;

	implicitAuthorizationGranted(payload: {
        userId: string;
    }): Promise<void>;

    contextualAuthorizationGranted(payload: {
        userId: string;
        action: Action;
        resource: AuthorizationResource;
    }): Promise<void>;

    implicitAuthorizationDenied(payload: {
        userId: string;
    }): Promise<void>;

	contextualAuthorizationDenied(payload: {
        userId: string;
        action: Action;
        resource: AuthorizationResource;
    }): Promise<void>;
}

export type { IdentityEventsPort };
