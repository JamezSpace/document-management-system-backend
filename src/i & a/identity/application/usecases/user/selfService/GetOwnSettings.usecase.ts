import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { MediaServicePort } from "../../../../../../shared/application/port/services/mediaService.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { IdentityChangeRequestRepositoryPort } from "../../../ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { SelfServiceRepositoryPort } from "../../../ports/repos/entities/user/SelfServiceRepository.port.js";

class GetOwnSettingsUseCase {
	constructor(
		private readonly selfServiceRepo: SelfServiceRepositoryPort,
		private readonly changeRequestRepo: IdentityChangeRequestRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly mediaService: MediaServicePort,
	) {}

	async execute(identityId: string, staffId: string) {
		const [settings, governance, changeRequests] = await Promise.all([
			this.selfServiceRepo.findSettings(identityId, staffId),
			this.policy.getActivePolicy(),
			this.changeRequestRepo.listByIdentity(identityId),
		]);
		if (!settings) {
			throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
				message: "The authenticated staff identity could not be found",
			});
		}

		return {
			revision: settings.revision,
			profile: {
				firstName: settings.firstName,
				middleName: settings.middleName,
				lastName: settings.lastName,
				email: settings.email,
				phoneNumber: settings.phoneNumber,
				profilePictureUrl: settings.profilePicture
					? this.mediaService.resolveMediaToPublicURL(settings.profilePicture)
					: null,
				signature: settings.signature,
			},
			employment: {
				staffId: settings.staffId,
				staffNumber: settings.staffNumber,
				employmentType: settings.employmentType,
				status: settings.status,
				unit: settings.unit,
				office: settings.office,
				designation: settings.designation,
			},
			governance: {
				policy: {
					key: governance.policyKey,
					version: governance.policyVersion,
				},
				fields: governance.fields,
			},
			pendingChanges: changeRequests
				.filter((request) => request.status === "pending")
				.map((request) => ({
					id: request.id,
					requestGroupId: request.requestGroupId,
					field: request.fieldName,
					status: request.status,
					requestedAt: request.requestedAt.toISOString(),
					policyKey: request.policyKey,
					policyVersion: request.policyVersion,
				})),
		};
	}
}

export default GetOwnSettingsUseCase;
