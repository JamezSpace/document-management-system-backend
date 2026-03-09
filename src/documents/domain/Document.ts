import DocumentVersion from "./DocumentVersion.js";
import { DisposalAction } from "./enum/disposalAction.enum.js";
import { LifecycleState } from "./enum/lifecycleState.enum.js";
import type { ClassificationMetadata } from "./metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "./metadata/Correspondence.metadata.js";
import type { RetentionMetadata } from "./metadata/Retention.metadata.js";

interface DocumentPayload {
	id: string;
	ownerId: string;
	title: string;
	version?: DocumentVersion | null;
    referenceNumber?: string | null;

	classification: ClassificationMetadata;
    correspondence: CorrespondenceMetadata;
	retention: RetentionMetadata;
}

/**
 * Represents the core Document entity in the system.
 * This is NOT a database model and NOT an API DTO.
 *
 * Responsibilities:
 * - Holds the canonical state of a document
 * - Enforces invariants (what is always true)
 * - Exposes domain-level behaviors (submit, approve, reject)
 */
class Document {
	// document identity
	readonly id: string;
	readonly ownerId: string;
	readonly title: string;
	private currentVersion: DocumentVersion | null;
    readonly referenceNumber: string | null;

	// Governance Domains (Value Objects)
	classification: ClassificationMetadata;
    correspondence: CorrespondenceMetadata;
	readonly retention: RetentionMetadata;

	// Audit
	readonly createdAt: Date;
	private modifiedAt: Date | null;

	// system flags
	// isLatestVersion!: boolean;
	// isEditable!: boolean;

	constructor(payload: DocumentPayload) {
		this.id = payload.id;
		this.ownerId = payload.ownerId;
		this.title = payload.title;
		this.currentVersion = payload.version ?? null;
        this.referenceNumber = payload.referenceNumber ?? null;

		this.classification = payload.classification;
        this.correspondence = payload.correspondence;
		this.retention = payload.retention;

		this.createdAt = new Date();
		this.modifiedAt = null;
	}

	getCurrentVersion(): DocumentVersion | null {
		return this.currentVersion;
	}

	public addVersion(mediaId: string, actorId: string): DocumentVersion {
		const version = new DocumentVersion({
			documentId: this.id,
			versionNumber: this.currentVersion
				? this.currentVersion.versionNumber + 1
				: 1,
			mediaId,
			lifecycle: {
				currentState: LifecycleState.DRAFT,
				stateEnteredAt: new Date(),
				stateEnteredBy: actorId,
			},
		});

		this.currentVersion = version;
		return version;
	}

	public createNextVersion(mediaId: string): DocumentVersion {
		if (!this.currentVersion) {
			throw new Error("Document has no version yet.");
		}

		if (
			this.currentVersion.lifecycle.currentState ===
			LifecycleState.DECLARED_RECORD
		) {
			throw new Error("Records cannot be versioned.");
		}

		return new DocumentVersion({
			documentId: this.id,
			versionNumber: this.currentVersion.versionNumber + 1,
			mediaId: mediaId,
			lifecycle: {
				currentState: LifecycleState.DRAFT,
				stateEnteredAt: new Date(),
				stateEnteredBy: this.ownerId,
			},
		});
	}

	public reclassify(
		newClassification: ClassificationMetadata,
		actorId: string,
	) {
		if (
			this.currentVersion?.lifecycle.currentState ===
			LifecycleState.DECLARED_RECORD
		) {
			throw new Error("Records cannot be reclassified.");
		}

		this.classification = {
			...newClassification,
			lastReclassifiedBy: actorId,
			lastReclassifiedAt: new Date(),
		};

		this.modifiedAt = new Date();
	}

	// retention metadata
	startRetention(startDate: Date) {
		if (this.retention.retentionStartDate) {
			throw new Error("Retention already started");
		}

		this.retention.retentionStartDate = startDate;
	}

	isEligibleForDisposition(currentDate: Date): boolean {
		return currentDate >= this.retention.disposalEligibilityDate;
	}

	getDispositionAction() {
		return this.retention.archivalRequired
			? DisposalAction.ARCHIVE
			: DisposalAction.DESTROY;
	}
}

export default Document;
