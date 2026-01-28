import {ApprovalState} from "./ApprovalState.js";
import DomainError from "../../shared/errors/DomainError.js";
import DomainErrorTypes from "../../shared/errors/types/DomainErrorTypes.js";

/**
 * This class contains methods that states business rules for an approval task. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class ApprovalStateTransition {
	static assertCanProgress(currentState: ApprovalState) {
		if (currentState !== ApprovalState.PENDING) {
			throw new DomainError(DomainErrorTypes.INVALID_APPROVAL_STATE, {
				currentState,
				targetState: ApprovalState.IN_PROGRESS,
			});
		}
	}

    static assertCanComplete(currentState: ApprovalState) {
        if (currentState !== ApprovalState.IN_PROGRESS) {
            throw new DomainError(DomainErrorTypes.INVALID_APPROVAL_STATE, {
                currentState,
                targetState: ApprovalState.COMPLETED,
            });
        }
    }

    static assertCanExpire(currentState: ApprovalState) {
        if (currentState !== ApprovalState.PENDING && currentState !== ApprovalState.IN_PROGRESS) {
            throw new DomainError(DomainErrorTypes.INVALID_APPROVAL_STATE, {
                currentState,
                targetState: ApprovalState.EXPIRED,
            });
        }
    }

    static assertCanSupersede(currentState: ApprovalState) {
        if (currentState !== ApprovalState.PENDING && currentState !== ApprovalState.IN_PROGRESS) {
            throw new DomainError(DomainErrorTypes.INVALID_APPROVAL_STATE, {
                currentState,
                targetState: ApprovalState.SUPERSEDED,
            });
        }
    }
}

export default ApprovalStateTransition;
