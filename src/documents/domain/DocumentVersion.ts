import DocumentTransitions from "./DocumentTransition.js";
import { LifecycleState } from "./enum/lifecycleState.enum.js";
import type { LifecycleMetadata } from "./metadata/Lifecycle.metadata.js";

interface DocumentVersionPayload {
	documentId: string;
	versionNumber: number;
	mediaId: string;
	lifecycle: LifecycleMetadata;
}

class DocumentVersion {
	documentId: string;
	versionNumber: number;
	mediaId: string;
	lifecycle: LifecycleMetadata;

	constructor(payload: DocumentVersionPayload) {
		this.documentId = payload.documentId;
		this.versionNumber = payload.versionNumber;
		this.mediaId = payload.mediaId;
		this.lifecycle = payload.lifecycle;
	}

	public getState(): LifecycleState {
		return this.lifecycle.currentState;
	}

	private transitionTo(newState: LifecycleState, actorId: string) {
		DocumentTransitions.transition(this.getState(), newState);

		this.lifecycle.currentState = newState;
		this.lifecycle.stateEnteredAt = new Date();
		this.lifecycle.stateEnteredBy = actorId;
	}

	submit(actorId: string) {
        this.transitionTo(LifecycleState.IN_REVIEW, actorId);
	}

	approve(actorId: string) {
        this.transitionTo(LifecycleState.APPROVED, actorId);
    }
	
    reject(actorId: string) {
        this.transitionTo(LifecycleState.CANCELLED, actorId);
    }

	declareRecord(actorId: string) {
        this.transitionTo(LifecycleState.DECLARED_RECORD, actorId);
    }

	archive(actorId: string) {
        this.transitionTo(LifecycleState.ARCHIVED, actorId);
    }

	dispose(actorId: string) {
        this.transitionTo(LifecycleState.DISPOSED, actorId);
    }
}

export default DocumentVersion;
