import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import { IdentityStatus } from "../../../domain/user/IdentityStatus.js";
import type { IdentityEventsPort } from "../../ports/events/IdentityEvents.port.js";
import type { IdentityRepositoryPort } from "../../ports/repos/IdentityRepository.port.js";

class ActivatePendingUserUseCase {
	constructor(
		private readonly identityEvents: IdentityEventsPort,
		private readonly identityRepo: IdentityRepositoryPort,
	) {}

	async activatePendingUser(authProviderId: string) {
		const userIdentity =
			await this.identityRepo.findIdentityByAuthProviderId(
				authProviderId,
			);
        
		if (!userIdentity)
			throw new ApplicationError(
				ApplicationErrorEnum.IDENTITY_NOT_FOUND,
				{
					message:
						"User authenticated externally but has no system identity",
					details: {
						userId: authProviderId,
					},
				},
			);

        // update user status
        const uid = userIdentity.getUserId();

        const identityFromDb = await this.identityRepo.updateIdentityStatus(uid, IdentityStatus.ACTIVE)

        // emit user activated event
        await this.identityEvents.userActivated({
            userId: uid
        })

        return identityFromDb;
	}
}

export default ActivatePendingUserUseCase;
