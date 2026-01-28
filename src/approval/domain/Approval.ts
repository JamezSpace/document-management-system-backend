import DomainError from "../../shared/errors/DomainError.js";
import { ApprovalState, ApprovalSupersedeCause } from "./ApprovalState.js";
import ApprovalStateTransition from "./ApprovalStateTransition.js";

interface ApprovalDTO {
	documentId: string;
	initialState: ApprovalState;
	expiresIn: number;
}

class Approval {
	readonly documentId: string;
	readonly expiresIn: number;
	private state: ApprovalState;
	readonly createdAt: Date;
	private supersededAt!: Date;
    private supersededCause!: ApprovalSupersedeCause;

	constructor(approval: ApprovalDTO) {
		this.documentId = approval.documentId;
		this.state = approval.initialState;
		this.expiresIn = approval.expiresIn;
		this.createdAt = new Date();
	}

	progress() {
		ApprovalStateTransition.assertCanProgress(this.state);
		this.state = ApprovalState.IN_PROGRESS;
	}

	complete() {
		ApprovalStateTransition.assertCanComplete(this.state);
		this.state = ApprovalState.COMPLETED;
	}

	expire() {
		ApprovalStateTransition.assertCanExpire(this.state);

		const currentTime = new Date().getTime(),
			approvalExpiryTime = this.createdAt.getTime() + this.expiresIn;

		if (currentTime < approvalExpiryTime) {
			throw new DomainError("EXPIRED_APPROVAL", {
				currentState: this.state,
				targetState: ApprovalState.EXPIRED,
			});
		}

		this.state = ApprovalState.EXPIRED;
	}

	supersede(cause: ApprovalSupersedeCause) {
		ApprovalStateTransition.assertCanSupersede(this.state);

		this.state = ApprovalState.SUPERSEDED;
		this.supersededAt = new Date();
		this.supersededCause = cause;
	}
}

export default Approval;
