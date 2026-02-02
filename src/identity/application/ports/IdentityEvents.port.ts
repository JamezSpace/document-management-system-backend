import type { ActionToBeAuthorized } from "../../domain/authorization/types/ActionToBeAuthorized.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.type.js";

/**
 * These wraps all events that would get triggered in the identity & authoiry subsystem
 */
interface IdentityEventsPort {
	userAuthenticated(payload: {
        userId: string;
        roles: string[];
        timestamp: Date;
    }): Promise<void>;

	implicitAuthorizationGranted(payload: {
        userId: string;
        timestamp: Date;
    }): Promise<void>;

    contextualAuthorizationGranted(payload: {
        userId: string;
        action: ActionToBeAuthorized;
        resource: AuthorizationResource;
        timestamp: Date;
    }): Promise<void>;

    implicitAuthorizationDenied(payload: {
        userId: string;
        timestamp: Date;
    }): Promise<void>;

	contextualAuthorizationDenied(payload: {
        userId: string;
        action: ActionToBeAuthorized;
        resource: AuthorizationResource;
        timestamp: Date;
    }): Promise<void>;
}

export type { IdentityEventsPort };
