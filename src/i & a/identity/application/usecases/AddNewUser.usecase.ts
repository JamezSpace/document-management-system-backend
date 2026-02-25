import Identity from "../../domain/Identity.js";
import { IdentityStatus } from "../../domain/IdentityStatus.js";
import type { IdentityEventsPort } from "../ports/events/IdentityEvents.port.js";
import type { IdGeneratorPort } from "../ports/IdGenerator.port.js";
import type { IdentityRepositoryPort } from "../ports/repos/IdentityRepository.port.js";
import type { User } from "../types/userDetails.type.js";

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

		const identityId = identity.getUserId();

		const userIdentity = await this.identityRepo.save({
			authProvider: payload.authProvider,
			identity: identity,
		});

        if(userIdentity)
            await this.identityEvents.userCreated({
                userId: identityId,
            });

		return userIdentity;
	}
}

export default AddNewUserUseCase;
