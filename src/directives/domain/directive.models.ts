type DirectiveStatus = "draft" | "issued" | "withdrawn" | "completed";
type DirectivePriority = "urgent" | "standard";
type DirectiveRegistryVolume = "operations" | "official";
type DirectiveTargetScope = "organization" | "unit" | "office";

type DirectiveTarget =
	| { type: "staff"; staffId: string }
	| { type: "unit"; unitId: string }
	| { type: "office"; officeId: string }
	| {
			type: "role";
			roleId: string;
			scopeType: DirectiveTargetScope;
			scopeUnitId: string | null;
			scopeOfficeId: string | null;
	  };

interface DirectiveRevisionInput {
	heading: string;
	instruction: string;
	expectedOutcome: string | null;
	priority: DirectivePriority;
	registryVolume: DirectiveRegistryVolume;
	completionDueAt: Date | null;
	sourceDocumentVersionId: string | null;
	targets: DirectiveTarget[];
}

interface DirectiveRevision extends Omit<DirectiveRevisionInput, "targets"> {
	id: string;
	directiveId: string;
	revisionNumber: number;
	contentSha256: string;
	supersedesRevisionId: string | null;
	changeReason: string | null;
	createdByStaffId: string;
	createdAt: Date;
	targets: DirectiveTarget[];
}

interface DirectiveAuthoritySnapshot {
	staffId: string;
	assignmentId: string;
	unitId: string | null;
	officeId: string | null;
	name: string;
	designation: string | null;
	unitName: string | null;
}

interface Directive {
	id: string;
	referenceNumber: string | null;
	status: DirectiveStatus;
	currentRevisionId: string | null;
	currentRevision: DirectiveRevision | null;
	issuedByStaffId: string | null;
	issuedUnderAssignmentId: string | null;
	issuingUnitId: string | null;
	issuingOfficeId: string | null;
	issuerNameSnapshot: string | null;
	issuerDesignationSnapshot: string | null;
	issuerUnitNameSnapshot: string | null;
	issuedAt: Date | null;
	effectiveFrom: Date | null;
	effectiveUntil: Date | null;
	acknowledgementRequired: boolean;
	completionRequired: boolean;
	completedAt: Date | null;
	completedByStaffId: string | null;
	withdrawnAt: Date | null;
	withdrawnByStaffId: string | null;
	withdrawalReason: string | null;
	version: number;
	createdAt: Date;
	updatedAt: Date | null;
}

interface ResolvedDirectiveAudienceMember {
	staffId: string;
	sources: Array<{
		type: DirectiveTarget["type"];
		targetId: string;
	}>;
}

interface DirectiveCompletionEvidence {
	id: string;
	directiveId: string;
	directiveRevisionId: string;
	documentVersionId: string | null;
	mediaAssetId: string | null;
	description: string | null;
	submittedByStaffId: string;
	submittedAt: Date;
	acceptance: {
		id: string;
		acceptedByStaffId: string;
		acceptedAt: Date;
		note: string | null;
	} | null;
}

interface DirectiveHistoryEntry {
	id: string;
	type: string;
	occurredAt: Date;
	actorStaffId: string | null;
	revisionId: string | null;
	details: Record<string, unknown>;
}

interface DirectiveListFilter {
	status?: DirectiveStatus;
	search?: string;
	limit: number;
}

export type {
	Directive,
	DirectiveAuthoritySnapshot,
	DirectiveCompletionEvidence,
	DirectiveHistoryEntry,
	DirectiveListFilter,
	DirectivePriority,
	DirectiveRegistryVolume,
	DirectiveRevision,
	DirectiveRevisionInput,
	DirectiveStatus,
	DirectiveTarget,
	DirectiveTargetScope,
	ResolvedDirectiveAudienceMember,
};
