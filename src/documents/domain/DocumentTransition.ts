import DomainError from "../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../shared/errors/enum/domain.enum.js";
import { LifecycleActions } from "./enum/lifecycleActions.enum.js";
import { LifecycleState } from "./enum/lifecycleState.enum.js";

/**
 * This class contains methods that states business rules for document state transitions. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class DocumentTransitions {
    private static allowedTransitions = {
        [LifecycleState.DRAFT]: [null, LifecycleState.IN_REVIEW], // null for CREATE helps to distinguish between items that were either rejected or cancelled
        [LifecycleState.IN_REVIEW]: [LifecycleState.DRAFT],
        [LifecycleState.APPROVED]: [LifecycleState.IN_REVIEW],
        [LifecycleState.ACTIVE]: [LifecycleState.APPROVED],
        [LifecycleState.DECLARED_RECORD]: [
            LifecycleState.APPROVED,
            LifecycleState.ACTIVE,
        ],
        [LifecycleState.ARCHIVED]: [
            LifecycleState.APPROVED,
            LifecycleState.ACTIVE,
            LifecycleState.DECLARED_RECORD,
        ],
        [LifecycleState.DISPOSED]: [
            LifecycleState.DECLARED_RECORD,
            LifecycleState.ARCHIVED,
        ],
        [LifecycleState.CANCELLED]: [LifecycleState.DRAFT, LifecycleState.IN_REVIEW],
    };

    static transition(prevState: LifecycleState | null, newState: LifecycleState) {
        const validSources = this.allowedTransitions[newState] as (LifecycleState | null)[];

        if (!validSources || !validSources.includes(prevState)) {
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState: prevState,
                targetState: newState,
            });
        }

        switch (newState) {
            case LifecycleState.DRAFT:
                if (prevState === LifecycleState.IN_REVIEW) this.assertCanReject(prevState);
                break;
            case LifecycleState.IN_REVIEW:
                this.assertCanSubmit(prevState!);
                break;
            case LifecycleState.APPROVED:
                this.assertCanApprove(prevState!);
                break;
            case LifecycleState.ACTIVE:
                this.assertCanActivate(prevState!);
                break;
            case LifecycleState.DECLARED_RECORD:
                this.assertCanDeclareRecord(prevState!);
                break;
            case LifecycleState.ARCHIVED:
                this.assertCanArchive(prevState!);
                break;
            case LifecycleState.DISPOSED:
                this.assertCanDispose(prevState!);
                break;
            case LifecycleState.CANCELLED:
                this.assertCanDelete(prevState!);
                break;
        }
    }

    private static assertCanCreate(currentState: LifecycleState) {
        // Logically, a document is DRAFT once created
        if (currentState !== LifecycleState.DRAFT)
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.DRAFT,
                details: { action: LifecycleActions.CREATE },
            });
    }

    private static assertCanSubmit(currentState: LifecycleState) {
        if (currentState !== LifecycleState.DRAFT)
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.IN_REVIEW, // Fixed
                details: { action: LifecycleActions.SUBMIT },
            });
    }

    private static assertCanDelete(currentState: LifecycleState) {
        // Soft delete logic
        if (![LifecycleState.DRAFT, LifecycleState.IN_REVIEW].includes(currentState))
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.CANCELLED, // Fixed
                details: { action: LifecycleActions.DELETE },
            });
    }

    private static assertCanApprove(currentState: LifecycleState) {
        if (currentState !== LifecycleState.IN_REVIEW)
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.APPROVED,
                details: { action: LifecycleActions.APPROVE },
            });
    }

    private static assertCanReject(currentState: LifecycleState) {
        if (currentState !== LifecycleState.IN_REVIEW)
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.DRAFT,
                details: { action: LifecycleActions.REJECT },
            });
    }

    private static assertCanActivate(currentState: LifecycleState) {
        if (currentState !== LifecycleState.APPROVED)
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.ACTIVE, // Fixed
                details: { action: LifecycleActions.ACTIVATE },
            });
    }

    private static assertCanDeclareRecord(currentState: LifecycleState) {
        if (![LifecycleState.APPROVED, LifecycleState.ACTIVE].includes(currentState))
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.DECLARED_RECORD, // Fixed
                details: { action: LifecycleActions.DECLARE_RECORD },
            });
    }

    static assertCanArchive(currentState: LifecycleState) {
        if (![LifecycleState.APPROVED, LifecycleState.ACTIVE, LifecycleState.DECLARED_RECORD].includes(currentState))
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.ARCHIVED,
                details: { action: LifecycleActions.ARCHIVE },
            });
    }

    static assertCanDispose(currentState: LifecycleState) {
        if (![LifecycleState.ARCHIVED, LifecycleState.DECLARED_RECORD].includes(currentState))
            throw new DomainError(GlobalDomainErrors.document.INVALID_DOCUMENT_STATE, {
                currentState,
                targetState: LifecycleState.DISPOSED,
                details: { action: LifecycleActions.DISPOSE },
            });
    }
}

export default DocumentTransitions;
