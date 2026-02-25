/**
 * These wraps all events that would get triggered in the identity & authoiry subsystem
 */
interface IdentityEventsPort {
	userAuthenticated(payload: {
		userId: string;
	}): Promise<void>;

	userAuthenticationFailed(payload: {
		userId?: string;
	}): Promise<void>;

    userCreated(payload: {
        userId: string;
    }): Promise<void>

    userActivated(payload: {
        userId: string;
    }): Promise<void>
}

export type { IdentityEventsPort };
