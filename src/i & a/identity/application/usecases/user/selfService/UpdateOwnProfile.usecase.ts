import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { SelfServiceRepositoryPort } from "../../../ports/repos/entities/user/SelfServiceRepository.port.js";

interface UpdateOwnProfileInput {
	identityId: string;
	staffId: string;
	officeId: string | null;
	unitId: string | null;
	phoneNumber: string;
	expectedRevision: number;
	requestId?: string;
}

class UpdateOwnProfileUseCase {
	constructor(
		private readonly repo: SelfServiceRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly auditRepo: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: UpdateOwnProfileInput) {
		const governance = await this.policy.evaluateField("phoneNumber");
		if (governance.decision.mode !== "direct") {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Phone number cannot be changed directly under the active policy",
				details: { reasonCode: governance.decision.reasonCode },
			});
		}

		const phoneNumber = input.phoneNumber.trim();
		if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Phone number must contain 10 to 15 digits with an optional leading plus",
			});
		}
		return this.transactionManager.execute(async (tx) => {
			const current = await this.repo.findSettings(
				input.identityId,
				input.staffId,
				tx,
			);
			if (!current) {
				throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
					message: "The authenticated identity could not be found",
				});
			}
			if (current.revision !== input.expectedRevision) {
				this.revisionConflict(current.revision);
			}

			if (current.phoneNumber === phoneNumber) {
				return {
					status: "unchanged" as const,
					revision: current.revision,
					profile: { phoneNumber },
					governanceDecision: this.decision(governance),
				};
			}

			const revision = await this.repo.updatePhoneNumber(
				input.identityId,
				phoneNumber,
				input.expectedRevision,
				tx,
			);
			if (revision === null) this.revisionConflict(current.revision);

			await this.auditRepo.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.staffId,
					actorType: "staff",
					action: "identity.profile.phone_number.update",
					eventType: "identity_self_service",
					aggregateType: "identity",
					aggregateId: input.identityId,
					officeId: input.officeId,
					unitId: input.unitId,
					outcome: "success",
					reason: governance.decision.reasonCode,
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: {
						policyKey: governance.policyKey,
						policyVersion: governance.policyVersion,
						changedFields: ["phoneNumber"],
						previousRevision: input.expectedRevision,
						newRevision: revision,
					},
				},
				tx,
			);

			return {
				status: "applied" as const,
				revision: revision!,
				profile: { phoneNumber },
				governanceDecision: this.decision(governance),
			};
		});
	}

	private decision(governance: Awaited<ReturnType<IdentityGovernancePolicyPort["evaluateField"]>>) {
		return {
			policyKey: governance.policyKey,
			policyVersion: governance.policyVersion,
			reasonCode: governance.decision.reasonCode,
			requirements: governance.decision.requirements,
		};
	}

	private revisionConflict(currentRevision: number): never {
		throw new ApplicationError(ApplicationErrorEnum.REVISION_CONFLICT, {
			message: "The profile changed after it was loaded",
			details: { currentRevision },
		});
	}
}

export default UpdateOwnProfileUseCase;
export type { UpdateOwnProfileInput };
