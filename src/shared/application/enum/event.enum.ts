enum UserEntityEvents {
	USER_CREATED = "user_created",
	USER_AUTHENTICATED = "user_authenticated",
	USER_AUTHENTICATION_FAILED = "user_authentication_failed",
    USER_ACTIVATED = "user_activated",
}

enum UnitEntityEvents {
    ORG_UNIT_CREATED = "organizational_units_created",
}

enum OfficeEntityEvents {
    OFFICE_CREATED = "office_created",
    OFFICE_UPDATED = "office_updated",
    OFFICE_DESIGNATION_CREATED = "office_designation_created",
    OFFICE_DESIGNATION_UPDATED = "office_designation_updated",
}

enum StaffEntityEvents {
    STAFF_ADDED = "staff_added",
    STAFF_UPDATED = "staff_updated",
    STAFF_CLASSIFICATION_CREATED = "staff_classification_created",
    STAFF_CLASSIFICATION_METADATA_MODIFIED = "staff_classification_metadata_modified",
    ONBOARDING_STAFF_EMAIL_SENT = "onboarding_staff_email_sent",
    STAFF_MEDIA_ASSIGNED = "staff_member_assigned",
    STAFF_MEDIA_REPLACED = "staff_member_replaced"
}

enum AccessModuleEvents {
    ROLE_CREATED = "role_created",
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
	DOCUMENT_MEDIA_ATTACHED = "document_media_attached",
	DOCUMENT_MEDIA_REPLACED = "document_media_replaced",
}

enum MediaEvents {
    MEDIA_ADDED = "media_added",
    MEDIA_REPLACED = "media_replaced",
}

const GlobalEventTypes = {
	identity_authority: {
        identity: {
            user: UserEntityEvents,
            staff: StaffEntityEvents,
            org_unit: UnitEntityEvents,
            office: OfficeEntityEvents,
        },
        access: AccessModuleEvents
    },
	document: DocumentEvents,
    media: MediaEvents
};


type ValueOf<T> = T[keyof T];

type ExtractEnumValues<T> =
    T extends Record<string, infer U>
        ? U extends string
            ? U
            : ValueOf<{ [K in keyof T]: ExtractEnumValues<T[K]> }>
        : never;

type EventType = ExtractEnumValues<typeof GlobalEventTypes>;

export { GlobalEventTypes, type EventType };
