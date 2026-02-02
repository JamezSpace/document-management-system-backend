interface DecisionDTO {
	documentId: string;
	action: string;
	actorId: string;
	reason: string | null;
}

class DocumentDecision {
	readonly documentId;
	readonly action; // APPROVED | REJECTED
	readonly actorId;
	readonly reason; // nullable for approval
	readonly timestamp;

	constructor(decision: DecisionDTO) {
		this.documentId = decision.documentId;
		this.action = decision.action;
		this.actorId = decision.actorId;
		this.reason = decision.reason;
		this.timestamp = new Date();
	}
}

export default DocumentDecision;
