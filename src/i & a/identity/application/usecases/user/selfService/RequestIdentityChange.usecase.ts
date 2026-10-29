import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import IdentityChangeRequest from "../../../../domain/entities/user/IdentityChangeRequest.js";
import type { GovernedIdentityChangeField } from "../../../types/user/selfService.type.js";
import type { IdentityChangeRequestRepositoryPort } from "../../../ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { SelfServiceRepositoryPort } from "../../../ports/repos/entities/user/SelfServiceRepository.port.js";

interface RequestIdentityChangeInput {
	identityId: string;
	staffId: string;
	officeId: string | null;
	unitId: string | null;
	changes: Partial<Record<GovernedIdentityChangeField, string | null>>;
	reason: string;
	evidenceMediaIds: string[];
	requestId?: string;
}

const governedFields: GovernedIdentityChangeField[] = [
	"firstName",
	"middleName",
	"lastName",
	"email",
	"signature",
];

class RequestIdentityChangeUseCase {
	constructor(
		private readonly settingsRepo: SelfServiceRepositoryPort,
		private readonly requestRepo: IdentityChangeRequestRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly auditRepo: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: RequestIdentityChangeInput) {
		const entries = governedFields.flatMap((field) => {
			const value = input.changes[field];
			if (value === undefined) return [];
			const normalized = typeof value === "string"
				? (field === "email" ? value.trim().toLowerCase() : value.trim())
				: null;
			return [[field, normalized] as const];
		});
		if (
			entries.length === 0 ||
			entries.some(
				([field, value]) =>
					(value === null && field !== "middleName") ||
					(typeof value === "string" && value.length === 0),
			)
		) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "At least one non-empty governed identity change is required",
			});
		}

		const [settings, governance, existing] = await Promise.all([
			this.settingsRepo.findSettings(input.identityId, input.staffId),
			this.policy.getActivePolicy(),
			this.requestRepo.listByIdentity(input.identityId),
		]);
		if (!settings) {
			throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
				message: "The authenticated identity could not be found",
			});
		}

		const pendingFields = new Set(
			existing.filter((request) => request.status === "pending").map((request) => request.fieldName),
		);
		const duplicate = entries.find(([field]) => pendingFields.has(field));
		if (duplicate) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: `A pending change already exists for ${duplicate[0]}`,
				details: { field: duplicate[0] },
			});
		}

		const decisions = entries.map(([field, requestedValue]) => {
			const decision = governance.fields[field] ?? {
				mode: "read_only" as const,
				reasonCode: "identity_field_not_governed_for_self_service",
				requirements: [],
			};
			if (!(["approval_required", "verification_required"] as const).includes(decision.mode as any)) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: `${field} must not be submitted as a governed change request`,
					details: { field, mode: decision.mode, reasonCode: decision.reasonCode },
				});
			}
			if (decision.requirements.includes("supporting_evidence") && input.evidenceMediaIds.length === 0) {
				throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
					message: `Supporting evidence is required to change ${field}`,
					details: { field, requirements: decision.requirements },
				});
			}
			return { field, requestedValue, decision };
		});

		const referencedMediaIds = new Set(input.evidenceMediaIds);
		for (const { field, requestedValue } of decisions) {
			if (field === "signature" && typeof requestedValue === "string") {
				referencedMediaIds.add(requestedValue);
			}
		}
		const ownership = await Promise.all(
			Array.from(referencedMediaIds, async (mediaId) => ({
				mediaId,
				owned: await this.settingsRepo.staffOwnsMedia(input.staffId, mediaId),
			})),
		);
		const unowned = ownership.find((entry) => !entry.owned);
		if (unowned) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Change-request media must belong to the authenticated staff member",
				details: { mediaId: unowned.mediaId },
			});
		}

		const currentValues: Record<GovernedIdentityChangeField, unknown> = {
			firstName: settings.firstName,
			middleName: settings.middleName,
			lastName: settings.lastName,
			email: settings.email,
			signature: settings.signature,
		};
		const noOp = decisions.find(
			({ field, requestedValue }) => currentValues[field] === requestedValue,
		);
		if (noOp) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: `${noOp.field} already has the requested value`,
				details: { field: noOp.field },
			});
		}
		const groupId = `ICRG-${this.idGenerator.generate()}`;
		const requestedAt = new Date();
		const requests = decisions.map(({ field, requestedValue, decision }) =>
			new IdentityChangeRequest({
				id: `ICR-${this.idGenerator.generate()}`,
				requestGroupId: groupId,
				identityId: input.identityId,
				staffId: input.staffId,
				fieldName: field,
				previousValue: currentValues[field],
				requestedValue,
				reason: input.reason,
				evidenceMediaIds: input.evidenceMediaIds,
				policyKey: governance.policyKey,
				policyVersion: governance.policyVersion,
				decisionReasonCode: decision.reasonCode,
				requestedAt,
			}).toRecord(),
		);

		await this.transactionManager.execute(async (tx) => {
			await this.requestRepo.saveBatch(requests, tx);
			await this.auditRepo.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.staffId,
					actorType: "staff",
					action: "identity.change_request.create",
					eventType: "identity_self_service",
					aggregateType: "identity",
					aggregateId: input.identityId,
					officeId: input.officeId,
					unitId: input.unitId,
					outcome: "success",
					reason: requests.map((request) => request.decisionReasonCode).join(","),
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: {
						requestGroupId: groupId,
						fields: requests.map((request) => request.fieldName),
						policyKey: governance.policyKey,
						policyVersion: governance.policyVersion,
					},
				},
				tx,
			);
		});

		return {
			requestGroupId: groupId,
			status: "pending" as const,
			requests: requests.map((request) => ({
				id: request.id,
				field: request.fieldName,
				status: request.status,
				reasonCode: request.decisionReasonCode,
				requirements: governance.fields[request.fieldName]?.requirements ?? [],
			})),
			submittedAt: requestedAt.toISOString(),
			policy: { key: governance.policyKey, version: governance.policyVersion },
		};
	}
}

export default RequestIdentityChangeUseCase;
export type { RequestIdentityChangeInput };
