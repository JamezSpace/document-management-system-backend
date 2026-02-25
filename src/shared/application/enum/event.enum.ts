enum IdentityModuleEvents {
	USER_CREATED = "user_created",
	USER_AUTHENTICATED = "user_authenticated",
	USER_AUTHENTICATION_FAILED = "user_authentication_failed",
    USER_ACTIVATED = "user_activated"
}

enum AccessModuleEvents {
    ROLE_REVOKED = "role_revoked",
    ROLE_DELEGATED = "role_delegated",
    OFFICIAL_ROLE_ASSIGNED = "official_role_assigned",
}

enum DocumentEvents {
	DOCUMENT_CREATED = "document_created",
	DOCUMENT_SUBMITTED = "document_submitted",
	DOCUMENT_APPROVED = "document_approved",
	DOCUMENT_REJECTED = "document_rejected",
	DOCUMENT_ARCHIVED = "document_archived",
	DOCUMENT_CANCELLED = "document_cancelled",
	DOCUMENT_ACTIVATED = "document_activated",
	DOCUMENT_DECLARED = "document_declared",
	DOCUMENT_DELETED = "document_deleted",
	DOCUMENT_DISPOSED = "document_disposed",
}

const GlobalEventTypes = {
	identity_authority: {
        identity: IdentityModuleEvents,
        access: AccessModuleEvents
    },
	document: DocumentEvents,
};

type EventType = IdentityModuleEvents | AccessModuleEvents | DocumentEvents;

export { GlobalEventTypes, type EventType };
