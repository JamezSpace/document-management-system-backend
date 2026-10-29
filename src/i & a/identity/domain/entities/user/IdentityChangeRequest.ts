import DomainError from "../../../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../../../shared/errors/enum/domain.enum.js";
import type {
	GovernedIdentityChangeField,
	IdentityChangeRequestRecord,
} from "../../../application/types/user/selfService.type.js";

interface IdentityChangeRequestPayload {
	id: string;
	requestGroupId: string;
	identityId: string;
	staffId: string;
	fieldName: GovernedIdentityChangeField;
	previousValue: unknown;
	requestedValue: unknown;
	reason: string;
	evidenceMediaIds: string[];
	policyKey: string;
	policyVersion: number;
	decisionReasonCode: string;
	requestedAt?: Date;
}

class IdentityChangeRequest {
	private readonly record: IdentityChangeRequestRecord;

	constructor(payload: IdentityChangeRequestPayload) {
		if (
			!payload.id ||
			!payload.requestGroupId ||
			!payload.identityId ||
			!payload.staffId ||
			!payload.reason.trim() ||
			!payload.policyKey ||
			payload.policyVersion <= 0 ||
			!payload.decisionReasonCode ||
			payload.requestedValue === undefined
		) {
			throw new DomainError(
				GlobalDomainErrors.identity_authority.identity.INCOMPLETE_REQUEST,
				{ message: "Identity change request is incomplete" },
			);
		}

		this.record = Object.freeze({
			...payload,
			reason: payload.reason.trim(),
			evidenceMediaIds: [...payload.evidenceMediaIds],
			status: "pending",
			requestedAt: payload.requestedAt ?? new Date(),
			reviewedBy: null,
			reviewedAt: null,
			reviewReason: null,
			appliedAt: null,
		});
	}

	toRecord(): IdentityChangeRequestRecord {
		return {
			...this.record,
			evidenceMediaIds: [...this.record.evidenceMediaIds],
		};
	}
}

export default IdentityChangeRequest;
