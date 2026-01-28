type AuditOutcome = "SUCCESS" | "DENIED" | "FAILED";

type AuditActorType = "USER" | "SYSTEM";
type AuditActorId =
	| string // only for userId
	| "WORKFLOW_ENGINE"
	| "POLICY_ENGINE"
	| "SCHEDULER"
	| "NOTIFICATION_DISPATCHER"
	| "EXTERNAL_INTEGRATION";

export type { AuditOutcome, AuditActorType, AuditActorId };