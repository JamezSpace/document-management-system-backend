import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { StaffMediaRepositoryPort } from "../../../ports/repos/entities/media/StaffMediaRepository.port.js";
import type { StaffAdministrationRepositoryPort } from "../../../ports/repos/entities/staff/StaffAdministrationRepository.port.js";
import type { IdentityChangeRequestRepositoryPort } from "../../../ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { AuthServicePort } from "../../../ports/services/AuthService.port.js";

interface ReviewIdentityChangeInput {
	requestId: string;
	reviewerId: string;
	reviewerOfficeId: string | null;
	reviewerUnitId: string | null;
	decision: "approve" | "reject";
	reason: string;
	requestTraceId?: string;
}

class ReviewIdentityChangeUseCase {
	constructor(
		private readonly requestRepository: IdentityChangeRequestRepositoryPort,
		private readonly staffRepository: StaffAdministrationRepositoryPort,
		private readonly staffMediaRepository: StaffMediaRepositoryPort,
		private readonly authService: AuthServicePort,
		private readonly identityPolicy: IdentityGovernancePolicyPort,
		private readonly auditRepository: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: ReviewIdentityChangeInput) {
		const reason = input.reason.trim();
		if (reason.length < 2) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "A review reason is required",
			});
		}

		let synchronizedEmail: {
			authProviderId: string;
			previousEmail: string;
		} | null = null;
		try {
			return await this.transactionManager.execute(async (tx) => {
			const request = await this.requestRepository.findById(input.requestId, tx);
			if (!request) {
				throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
					message: "Identity change request not found",
				});
			}
			if (request.status !== "pending") {
				throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
					message: "Identity change request has already been reviewed",
					details: { status: request.status },
				});
			}
			if (request.staffId === input.reviewerId) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "A staff member cannot review their own identity change request",
				});
			}

			const governance = await this.identityPolicy.evaluateField(request.fieldName);
			const approvableModes = new Set(["approval_required", "verification_required"]);
			if (
				input.decision === "approve" &&
				!approvableModes.has(governance.decision.mode)
			) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "The active policy no longer permits approval of this change",
					details: { reasonCode: governance.decision.reasonCode },
				});
			}

			let newRevision: number | null = null;
			const finalStatus = input.decision === "reject" ? "rejected" : "applied";
			if (input.decision === "approve") {
				if (request.fieldName === "signature") {
					if (typeof request.requestedValue !== "string") {
						throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
							message: "The requested signature media is invalid",
						});
					}
					await this.staffMediaRepository.deactivateByRole(request.staffId, "SIGNATURE", tx);
					await this.staffMediaRepository.save(
						{
							staffId: request.staffId,
							mediaId: request.requestedValue,
							assetRole: "SIGNATURE",
							isActive: true,
							assignedAt: new Date(),
						},
						tx,
					);
				} else {
					if (request.fieldName === "email") {
						if (
							typeof request.requestedValue !== "string" ||
							typeof request.previousValue !== "string"
						) {
							throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
								message: "The requested email change is invalid",
							});
						}
						const authProviderId = await this.staffRepository.findAuthProviderId(
							request.identityId,
							tx,
						);
						if (!authProviderId) {
							throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
								message: "The external authentication identity could not be found",
							});
						}
						await this.authService.updateUserEmail(
							authProviderId,
							request.requestedValue,
						);
						synchronizedEmail = {
							authProviderId,
							previousEmail: request.previousValue,
						};
					}
					newRevision = await this.staffRepository.applyIdentityChange(
						request.identityId,
						request.fieldName,
						request.requestedValue as string | null,
						tx,
					);
				}
			}

			const completed = await this.requestRepository.completeReview(
				request.id,
				finalStatus,
				input.reviewerId,
				reason,
				tx,
			);
			if (!completed) {
				throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
					message: "Identity change request was reviewed concurrently",
				});
			}

			await this.auditRepository.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.reviewerId,
					actorType: "staff",
					capability: "identity.change.review",
					action: `identity.change_request.${finalStatus}`,
					eventType: "identity_change_review",
					aggregateType: "identity_change_request",
					aggregateId: request.id,
					officeId: input.reviewerOfficeId,
					unitId: input.reviewerUnitId,
					outcome: "success",
					reason,
					...(input.requestTraceId ? { requestId: input.requestTraceId } : {}),
					metadata: {
						requestGroupId: request.requestGroupId,
						identityId: request.identityId,
						staffId: request.staffId,
						field: request.fieldName,
						decision: input.decision,
						previousValue: request.previousValue,
						requestedValue: request.requestedValue,
						newRevision,
						requestPolicyKey: request.policyKey,
						requestPolicyVersion: request.policyVersion,
						reviewPolicyKey: governance.policyKey,
						reviewPolicyVersion: governance.policyVersion,
					},
				},
				tx,
			);

			return {
				requestId: request.id,
				requestGroupId: request.requestGroupId,
				status: finalStatus,
				field: request.fieldName,
				newRevision,
				reviewedBy: input.reviewerId,
				reviewReason: reason,
			};
			});
		} catch (error: unknown) {
			const emailToRestore = synchronizedEmail as {
				authProviderId: string;
				previousEmail: string;
			} | null;
			if (emailToRestore) {
				await this.authService.updateUserEmail(
					emailToRestore.authProviderId,
					emailToRestore.previousEmail,
				);
			}
			throw error;
		}
	}
}

export default ReviewIdentityChangeUseCase;
export type { ReviewIdentityChangeInput };
