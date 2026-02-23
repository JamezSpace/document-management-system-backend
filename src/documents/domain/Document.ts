import type { DocumentSchemaType } from "../api/types/document.type.js";
import DocumentTransitions from "./DocumentTransition.js";
import { DocumentType } from "./enum/documentTypes.enum.js";
import { LifecycleState } from "./enum/lifecycleState.enum.js";
import type { LifecycleMetadata } from "./metadata/Lifecycle.metadata.js";

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
	//  NOTICE: id is not initialized at first, this is because the database handles the generation better implementing uuid v7 natively for faster queries
	id!: string;
	readonly ownerId: string;
	readonly title: string;
	readonly documentType: DocumentType;
	private version!: number;

	// Governance Domains (Value Objects)
	// classification: ClassificationMetadata;
	// retention: RetentionMetadata;
	// integrity: IntegrityMetadata;
	readonly lifecycle: LifecycleMetadata;

	// Audit
	readonly createdAt: Date;
	private modifiedAt: Date | null;

	// system flags
	isLatestVersion!: boolean;
	isEditable!: boolean;

	// private domainEvents: DomainEvent[] = [];

	constructor(payload: DocumentSchemaType) {
		this.ownerId = payload.ownerId;
		this.title = payload.title;
		this.documentType = payload.documentType;

		// this.classification = payload.classification;
		// this.retention = payload.retention;
		// this.integrity = payload.integrity;

		this.lifecycle = {
			currentState: payload.lifecycle.currentState,
			stateEnteredAt: new Date(payload.lifecycle.enteredAt),
			stateEnteredBy: payload.lifecycle.enteredBy,
		} as LifecycleMetadata;
		// this.stateEnteredAt = new Date();
		// this.stateEnteredBy = payload.createdBy;

		this.createdAt = new Date();
		this.modifiedAt = null;
	}

	public getState(): LifecycleState | null {
		return this.lifecycle.currentState;
	}

	private transitionTo(newState: LifecycleState) {
		DocumentTransitions.transition(this.getState(), newState);
	}

	public create() {
		this.transitionTo(LifecycleState.DRAFT);
	}

	public createNewVersion(newContentUri: string) {
		if (this.lifecycle.currentState === LifecycleState.DECLARED_RECORD) {
			throw new Error("Records cannot be versioned.");
		}

		this.version += 1;
		this.lifecycle.currentState = LifecycleState.DRAFT;
		this.contentUri = newContentUri;
	}

	// // Lifecycle Behaviors
	// public submit(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("SUBMIT", actorId, policy);
	// }

	// public approve(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("APPROVE", actorId, policy);
	// }

	// public reject(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("REJECT", actorId, policy);
	// }

	// public declareRecord(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("DECLARE_RECORD", actorId, policy);
	// }

	// public archive(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("ARCHIVE", actorId, policy);
	// }

	// public dispose(actorId: string, policy: LifecyclePolicyEvaluator) {
	// 	this.transition("DISPOSE", actorId, policy);
	// }

	// // Core Transition Logic
	// private transition(
	// 	event: LifecycleEventType,
	// 	actorId: string,
	// 	policy: LifecyclePolicyEvaluator,
	// ) {
	// 	policy.assertTransitionAllowed({
	// 		document: this,
	// 		currentState: this.lifecycleState,
	// 		event,
	// 		actorId,
	// 	});

	// 	const newState = DocumentTransitions.getNextState(
	// 		this.lifecycleState,
	// 		event,
	// 	);

	// 	this.lifecycleState = newState;
	// 	this.stateEnteredAt = new Date();
	// 	this.stateEnteredBy = actorId;
	// 	this.modifiedAt = new Date();

	// 	this.domainEvents.push(
	// 		new DocumentStateChangedEvent(this.id, event, newState),
	// 	);
	// }

	// public pullDomainEvents(): DomainEvent[] {
	// 	const events = this.domainEvents;
	// 	this.domainEvents = [];
	// 	return events;
	// }
}

export default Document;
