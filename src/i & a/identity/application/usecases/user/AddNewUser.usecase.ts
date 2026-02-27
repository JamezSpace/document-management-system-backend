import type { IdGeneratorPort } from "../../../../../shared/application/port/IdGenerator.port.js";
import Identity from "../../../domain/user/Identity.js";
import { IdentityStatus } from "../../../domain/user/IdentityStatus.js";
import type { IdentityEventsPort } from "../../ports/events/IdentityEvents.port.js";
import type { IdentityRepositoryPort } from "../../ports/repos/IdentityRepository.port.js";
import type { User } from "../../types/userDetails.type.js";

class AddNewUserUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly identityEvents: IdentityEventsPort,
		private readonly identityRepo: IdentityRepositoryPort,
	) {}

	async addNewUser(payload: Omit<User, 'status' | 'uid'>) {
        const uuid = this.idGenerator.generate();
        const userId = 'USER-' + uuid

		// create an identity
		const identity = new Identity({
			uid: userId,
            authProviderId: payload.authProviderId,
			email: payload.email,
			status: IdentityStatus.PENDING,
            firstName: payload.firstName,
            lastName: payload.lastName,
            middleName: payload.middleName,
		});

		const newUserIdentity = await this.identityRepo.save({
            authProvider: payload.authProvider,
			identity: identity,
		});

        const identityId = newUserIdentity.getUserId()

        if(newUserIdentity)
            await this.identityEvents.userCreated({
                userId: identityId,
            });

		return newUserIdentity;
	}
}

export default AddNewUserUseCase;
