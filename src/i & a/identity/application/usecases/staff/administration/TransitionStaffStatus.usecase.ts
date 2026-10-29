import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import { Status } from "../../../../domain/enum/staff.enum.js";
import type { StaffAdministrationRepositoryPort } from "../../../ports/repos/entities/staff/StaffAdministrationRepository.port.js";

interface TransitionStaffStatusInput {
	staffId: string;
	actorId: string;
	actorOfficeId: string | null;
	actorUnitId: string | null;
	actorCapabilities: string[];
	toStatus: Status;
	reason: string;
	expectedRevision: number;
	requestId?: string;
}

class TransitionStaffStatusUseCase {
	constructor(
		private readonly repository: StaffAdministrationRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly auditRepository: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: TransitionStaffStatusInput) {
		const reason = input.reason.trim();
		if (reason.length < 2) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "A reason is required for a staff status transition",
			});
		}
		const requiredCapability = input.toStatus === Status.ACTIVE
			? "staff.activate"
			: "staff.deactivate";
		if (!input.actorCapabilities.includes(requiredCapability)) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, {
				message: `Missing capability: ${requiredCapability}`,
			});
		}

		return this.transactionManager.execute(async (tx) => {
			const current = await this.repository.findById(input.staffId, tx);
			if (!current) {
				throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
					message: "Staff record not found",
				});
			}
			if (current.revision !== input.expectedRevision) {
				this.revisionConflict(current.revision);
			}
			if (current.status === input.toStatus) {
				throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
					message: `Staff record is already ${input.toStatus}`,
				});
			}

			const governance = await this.policy.evaluateField(
				`status.${current.status}.${input.toStatus}`,
			);
			if (governance.decision.mode !== "direct") {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: `Transition from ${current.status} to ${input.toStatus} is not permitted`,
					details: { reasonCode: governance.decision.reasonCode },
				});
			}
			if (
				governance.decision.requirements.includes("target_must_not_be_actor") &&
				input.staffId === input.actorId
			) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "Administrators cannot change their own staff status",
					details: { reasonCode: "staff_status_self_change_forbidden" },
				});
			}

			const updated = await this.repository.transitionStatus(
				input.staffId,
				input.toStatus,
				input.expectedRevision,
				tx,
			);
			if (!updated) this.revisionConflict(current.revision);

			await this.auditRepository.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.actorId,
					actorType: "staff",
					capability: requiredCapability,
					action: "identity.staff.status.transition",
					eventType: "staff_administration",
					aggregateType: "staff",
					aggregateId: input.staffId,
					officeId: input.actorOfficeId,
					unitId: input.actorUnitId,
					outcome: "success",
					reason,
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: {
						fromStatus: current.status,
						toStatus: input.toStatus,
						previousRevision: current.revision,
						newRevision: updated!.revision,
						policyKey: governance.policyKey,
						policyVersion: governance.policyVersion,
						decisionReasonCode: governance.decision.reasonCode,
					},
				},
				tx,
			);
			return updated!;
		});
	}

	private revisionConflict(currentRevision: number): never {
		throw new ApplicationError(ApplicationErrorEnum.STAFF_REVISION_CONFLICT, {
			message: "The staff record changed after it was loaded",
			details: { currentRevision },
		});
	}
}

export default TransitionStaffStatusUseCase;
export type { TransitionStaffStatusInput };
