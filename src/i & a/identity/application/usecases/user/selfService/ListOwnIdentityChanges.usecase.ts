import type { IdentityChangeRequestRepositoryPort } from "../../../ports/repos/entities/user/IdentityChangeRequestRepository.port.js";

class ListOwnIdentityChangesUseCase {
	constructor(private readonly repository: IdentityChangeRequestRepositoryPort) {}

	async execute(identityId: string) {
		return (await this.repository.listByIdentity(identityId)).map((request) => ({
			id: request.id,
			requestGroupId: request.requestGroupId,
			field: request.fieldName,
			requestedValue: request.requestedValue,
			reason: request.reason,
			status: request.status,
			policy: { key: request.policyKey, version: request.policyVersion },
			reasonCode: request.decisionReasonCode,
			requestedAt: request.requestedAt.toISOString(),
			reviewedAt: request.reviewedAt?.toISOString() ?? null,
			reviewReason: request.reviewReason,
			appliedAt: request.appliedAt?.toISOString() ?? null,
		}));
	}
}

export default ListOwnIdentityChangesUseCase;
