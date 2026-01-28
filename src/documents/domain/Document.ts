import DocumentState from "./DocumentState.js";
import DocumentTransitions from "./DocumentTransition.js";

interface DocumentDTO {
	id: string;
	ownerId: string;
	initialState: DocumentState;
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
	readonly id: string;
	readonly ownerId: string;
	private state: DocumentState;
	readonly createdAt: Date;

	constructor(document: DocumentDTO) {
		this.id = document.id;
		this.ownerId = document.ownerId;
		this.state = document.initialState;
		this.createdAt = new Date();
	}

    
    public getState() : DocumentState {
        return this.state;
    }
    

    /**
     * submit verfies if the document transition to submit is allowed and performs action based on that
     */
    public submit() {
        DocumentTransitions.assertCanSubmit(this.state)
        this.state = DocumentState.SUBMITTED
    }

    /**
     * approve verfies if the document transition to approved is allowed and performs action based on that
     */
    public approve() {
        DocumentTransitions.assertCanApprove(this.state)
        this.state = DocumentState.APPROVED
    }

    /**
     * reject verfies if the document transition to rejected is allowed and performs action based on that
     */
    public reject() {
        DocumentTransitions.assertCanReject(this.state)
        this.state = DocumentState.REJECTED
    }

    /**
     * archive verifies if the document transition to archived is allowed
     */
    public archive() {
        DocumentTransitions.assertCanArchive(this.state)
        this.state = DocumentState.ARCHIVED
    }
}

export default Document;
