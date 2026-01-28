import type { Action } from "../../domain/IdentityState.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.js";

/**
 * These wraps all events that would get triggered in the identity & authoiry subsystem
 */
interface IdentityEvents {
	userAuthenticated(payload: {
        userId: string;
        roles: string[];
    }): Promise<void>;

	authorizationGranted(payload: {
        userId: string;
        action: Action;
        resource: AuthorizationResource;
    }): Promise<void>;

	authorizationDenied(payload: {
        userId: string;
        action: Action;
        resource: AuthorizationResource;
    }): Promise<void>;
}

export type { IdentityEvents };
