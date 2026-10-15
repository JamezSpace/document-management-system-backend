import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	Directive,
	DirectiveCompletionEvidence,
	DirectiveHistoryEntry,
	DirectiveListFilter,
	DirectiveRevision,
	DirectiveRevisionInput,
	DirectiveTarget,
	ResolvedDirectiveAudienceMember,
} from "../../domain/directive.models.js";

interface DirectiveVisibilityScope {
	staffId: string;
	organization: boolean;
	unitIds: string[];
	officeIds: string[];
}

interface DirectiveRepositoryPort {
	createDraft(input: {
		id: string;
		referenceNumber: string | null;
		issuingUnitId: string | null;
		issuingOfficeId: string | null;
		acknowledgementRequired: boolean;
		completionRequired: boolean;
		createdAt: Date;
	}, tx: TransactionContext): Promise<void>;
	createRevision(input: {
		id: string;
		directiveId: string;
		revisionNumber: number;
		revision: DirectiveRevisionInput;
		contentSha256: string;
		supersedesRevisionId: string | null;
		changeReason: string | null;
		createdByStaffId: string;
		createdAt: Date;
	}, tx: TransactionContext): Promise<void>;
	createTargets(
		directiveRevisionId: string,
		targets: Array<{ id: string; target: DirectiveTarget }>,
		createdByStaffId: string,
		createdAt: Date,
		tx: TransactionContext,
	): Promise<void>;
	setCurrentRevision(
		directiveId: string,
		revisionId: string,
		expectedVersion: number,
		updatedAt: Date,
		tx: TransactionContext,
	): Promise<boolean>;
	findById(id: string, tx?: TransactionContext, forUpdate?: boolean): Promise<Directive | null>;
	list(scope: DirectiveVisibilityScope, filter: DirectiveListFilter): Promise<Directive[]>;
	isRecipient(directiveRevisionId: string, staffId: string, tx?: TransactionContext): Promise<boolean>;
	issue(input: {
		directiveId: string;
		expectedVersion: number;
		referenceNumber: string;
		authority: {
			staffId: string;
			assignmentId: string;
			unitId: string | null;
			officeId: string | null;
			name: string;
			designation: string | null;
			unitName: string | null;
		};
		issuedAt: Date;
		effectiveFrom: Date;
		effectiveUntil: Date | null;
	}, tx: TransactionContext): Promise<boolean>;
	createDeliveries(
		directiveRevisionId: string,
		members: Array<ResolvedDirectiveAudienceMember & { deliveryId: string; sourceIds: string[] }>,
		deliveredAt: Date,
		tx: TransactionContext,
	): Promise<void>;
	withdraw(input: {
		directiveId: string;
		expectedVersion: number;
		staffId: string;
		reason: string;
		occurredAt: Date;
	}, tx: TransactionContext): Promise<boolean>;
	complete(input: {
		directiveId: string;
		expectedVersion: number;
		staffId: string;
		occurredAt: Date;
	}, tx: TransactionContext): Promise<boolean>;
	markSeen(directiveRevisionId: string, staffId: string, seenAt: Date, tx: TransactionContext): Promise<boolean>;
	acknowledge(input: {
		id: string;
		directiveRevisionId: string;
		staffId: string;
		statement: string | null;
		acknowledgedAt: Date;
	}, tx: TransactionContext): Promise<boolean>;
	appendEvent(input: {
		id: string;
		directiveId: string;
		directiveRevisionId: string | null;
		eventType: string;
		actorStaffId: string | null;
		actorAssignmentId: string | null;
		correlationId: string | null;
		metadata: Record<string, unknown>;
		occurredAt: Date;
	}, tx: TransactionContext): Promise<void>;
	listHistory(directiveId: string): Promise<DirectiveHistoryEntry[]>;
	addEvidence(input: {
		id: string;
		directiveId: string;
		directiveRevisionId: string;
		documentVersionId: string | null;
		mediaAssetId: string | null;
		description: string | null;
		submittedByStaffId: string;
		submittedAt: Date;
	}, tx: TransactionContext): Promise<void>;
	listEvidence(directiveId: string): Promise<DirectiveCompletionEvidence[]>;
	acceptEvidence(input: {
		id: string;
		evidenceId: string;
		acceptedByStaffId: string;
		acceptedAt: Date;
		note: string | null;
	}, tx: TransactionContext): Promise<boolean>;
	hasAcceptedEvidence(directiveId: string, tx: TransactionContext): Promise<boolean>;
}

export type { DirectiveRepositoryPort, DirectiveVisibilityScope };
