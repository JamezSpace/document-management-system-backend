import DocumentState from "./DocumentState.js";
import DomainError from "../../shared/errors/DomainError.js";
import DomainErrorTypes from "../../shared/errors/types/DomainErrorTypes.js";

/**
 * This class contains methods that states business rules for document state transitions. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class DocumentTransitions {
	static assertCanSubmit(currentState: DocumentState) {
		if (currentState !== DocumentState.DRAFT)
			throw new DomainError(DomainErrorTypes.INVALID_DOCUMENT_STATE, {
				currentState: currentState,
				targetState: DocumentState.SUBMITTED,
			});
	}

	static assertCanApprove(currentState: DocumentState) {
		if (currentState !== DocumentState.SUBMITTED)
			throw new DomainError(DomainErrorTypes.INVALID_DOCUMENT_STATE, {
				currentState: currentState,
				targetState: DocumentState.APPROVED,
			});
	}

	static assertCanReject(currentState: DocumentState) {
		if (currentState !== DocumentState.SUBMITTED)
			throw new DomainError(DomainErrorTypes.INVALID_DOCUMENT_STATE, {
				currentState: currentState,
				targetState: DocumentState.REJECTED,
			});
	}

	static assertCanArchive(currentState: DocumentState) {
		if (
			![DocumentState.APPROVED, DocumentState.REJECTED].includes(currentState)
		)
			throw new DomainError(DomainErrorTypes.INVALID_DOCUMENT_STATE, {
				currentState: currentState,
				targetState: DocumentState.ARCHIVED,
			});
	}
}

export default DocumentTransitions;
