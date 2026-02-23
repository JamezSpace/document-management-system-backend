import ApplicationError from "../../../../shared/errors/ApplicationError.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { RoleRepositoryPort } from "../../../access/application/ports/RolesRepository.port.js";
import Identity from "../../domain/Identity.js";
import { IdentityStatus } from "../../domain/IdentityStatus.js";
import type { IdentityEventsPort } from "../ports/events/IdentityEvents.port.js";
import type { IdentityRepositoryPort } from "../ports/repos/IdentityRepository.port.js";
import type { User } from "../types/userDetails.type.js";

class AddNewUserUseCase {
	constructor(
		private readonly roleRepo: RoleRepositoryPort,
		private readonly identityEvents: IdentityEventsPort,
		private readonly identityRepo: IdentityRepositoryPort,
	) {}

	async addNewUser(payload: User) {
		// check if role exists in the RoleRegistry
		const role = this.roleRepo.findByName(payload.role);

		if (!role)
			throw new ApplicationError(ApplicationErrorEnum.ROLE_NOT_FOUND, {
				message: "Role doesnt exist in database under this department.",
				details: {
					role: payload.role,
				},
			});

		// create an identity
		const identity = new Identity({
			uid: payload.uid,
			email: payload.email,
			name: payload.name,
			role: payload.role,
			status: IdentityStatus.PENDING,
		});
		const identityId = identity.getUserId();

		await this.identityRepo.save(identity);

		await this.identityEvents.userCreated({
			userId: identityId,
		});

		return identity;
	}
}

export default AddNewUserUseCase;
