import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { StaffAdministrationRepositoryPort } from "../../../ports/repos/entities/staff/StaffAdministrationRepository.port.js";
import type {
	AdministrativeStaffRecord,
	AdministrativeStaffUpdate,
} from "../../../types/staff/staffAdministration.type.js";

interface UpdateAdministrativeStaffInput {
	staffId: string;
	actorId: string;
	actorOfficeId: string | null;
	actorUnitId: string | null;
	changes: AdministrativeStaffUpdate;
	reason: string;
	expectedRevision: number;
	requestId?: string;
}

const policyFieldByInput: Record<keyof AdministrativeStaffUpdate, string> = {
	staffNumber: "staffNumber",
	employmentType: "employmentType",
	unitId: "unit",
	officeId: "office",
	designationId: "designation",
};

class UpdateAdministrativeStaffUseCase {
	constructor(
		private readonly repository: StaffAdministrationRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly auditRepository: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: UpdateAdministrativeStaffInput) {
		const reason = input.reason.trim();
		const fields = Object.keys(input.changes) as Array<keyof AdministrativeStaffUpdate>;
		if (fields.length === 0 || reason.length < 2) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "At least one administrative change and a reason are required",
			});
		}

		const decisions = await Promise.all(
			fields.map(async (field) => {
				const governance = await this.policy.evaluateField(policyFieldByInput[field]);
				if (governance.decision.mode !== "direct") {
					throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
						message: `${field} cannot be changed administratively under the active policy`,
						details: { field, reasonCode: governance.decision.reasonCode },
					});
				}
				return governance;
			}),
		);

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

			const updated = await this.repository.updateDetails(
				input.staffId,
				input.changes,
				input.expectedRevision,
				tx,
			);
			if (!updated) this.revisionConflict(current.revision);

			await this.auditRepository.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.actorId,
					actorType: "staff",
					capability: "staff.update",
					action: "identity.staff.administration.update",
					eventType: "staff_administration",
					aggregateType: "staff",
					aggregateId: input.staffId,
					officeId: input.actorOfficeId,
					unitId: input.actorUnitId,
					outcome: "success",
					reason,
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: {
						fields,
						before: this.pick(current, fields),
						after: this.pick(updated!, fields),
						previousRevision: current.revision,
						newRevision: updated!.revision,
						policyKey: decisions[0]!.policyKey,
						policyVersion: decisions[0]!.policyVersion,
						decisionReasonCodes: decisions.map((item) => item.decision.reasonCode),
					},
				},
				tx,
			);
			return updated!;
		});
	}

	private pick(
		record: AdministrativeStaffRecord,
		fields: Array<keyof AdministrativeStaffUpdate>,
	) {
		return Object.fromEntries(
			fields.map((field) => {
				const value = field === "unitId"
					? record.unit.id
					: field === "officeId"
						? record.office.id
						: field === "designationId"
							? record.designation.id
							: record[field];
				return [field, value];
			}),
		);
	}

	private revisionConflict(currentRevision: number): never {
		throw new ApplicationError(ApplicationErrorEnum.STAFF_REVISION_CONFLICT, {
			message: "The staff record changed after it was loaded",
			details: { currentRevision },
		});
	}
}

export default UpdateAdministrativeStaffUseCase;
export type { UpdateAdministrativeStaffInput };
