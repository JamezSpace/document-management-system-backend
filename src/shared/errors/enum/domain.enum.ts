enum IdentityModuleErrors {
    USER_NOT_AUTHORIZED = "user_not_authorized",
    USER_ALREADY_AUTHENTICATED = "user_already_authenticated",
    USER_NOT_AUTHENTICATED = "user_not_authenticated",
USER_NOT_ACTIVE = "user_not_active"
}

enum AccessModuleErrorscess {
    OFFICIAL_ROLE_ALREADY_ASSIGNED = "official_role_already_Assigned",
    PERMISSION_NOT_GRANTED = "permission_not_granted",
    DELEGATED_ROLE_MISSING_EXPIRY = "delegated_role_missing_expiry",
    UNKNOWN_PERMISSION = "unknown_permission",
    UNKNOWN_ROLE = "unknown_role",
    ROLE_NOT_ACTIVE = "role_not_active",
    INVALID_ROLE_REVOCATION_DATE = "invalid_role_revocation_date",
    ROLE_ALREADY_CLOSED = "role_already_closed",
}

enum Document {
    INVALID_DOCUMENT_STATE = "invalid_document_state",
}

enum Workflow {
    INVALID_WORKFLOW_STATE = "invalid_workflow_state",
    INVALID_APPROVAL_STATE = "invalid_approval_state",
    EXPIRED_APPROVAL = "expired_approval",
}

const GlobalDomainErrors = {
    identity_authority: {
        identity: IdentityModuleErrors,
        access: AccessModuleErrorscess
    },
    workflow: Workflow,
    document: Document
}

type DomainErrorCode =
	| IdentityModuleErrors
	| AccessModuleErrorscess
	| Document
	| Workflow;


export { GlobalDomainErrors, type DomainErrorCode };

