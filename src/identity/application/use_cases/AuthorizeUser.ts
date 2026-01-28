import ApplicationError from "../../../shared/errors/ApplicationError.js";
import DomainError from "../../../shared/errors/DomainError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import DomainErrorTypes from "../../../shared/errors/types/DomainErrorTypes.js";
import type Identity from "../../domain/Identity.js";
import { Action, IdentityState } from "../../domain/IdentityState.js";
import type { IdentityRepository } from "../../infrastructure/IdentityRepository.type.js";
import type { IdentityEvents } from "../events/IdentityEvents.type.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.js";

class AuthorizeUser {
	private readonly identityRepo: IdentityRepository;
	private readonly identityEvents: IdentityEvents;

	constructor(
		identityRepo: IdentityRepository,
		identityEvents: IdentityEvents,
	) {
		this.identityRepo = identityRepo;
		this.identityEvents = identityEvents;
	}

	async authorizeUser(userIdentity: Identity, action: Action, resource: AuthorizationResource) {
		try {
			// check to see if the user has been authenticated
			if (userIdentity.getState() === IdentityState.NOT_AUTHENTICATED)
				throw new ApplicationError(
					ApplicationErrorTypes.USER_NOT_AUTHENTICATED,
					{
						message:
							"User must be authenticated before authorization",
						details: {
							currentState: userIdentity.getState(),
						},
					},
				);

			// check if user is authorized to perform action
			userIdentity.authorize(action);

			// persist new state
			this.identityRepo.save(userIdentity);

			// emit authorization granted event
			this.identityEvents.authorizationGranted({
				userId: userIdentity.userId,
				action: action,
                resource
			});
		} catch (error) {
            if(error instanceof DomainError && error.code === DomainErrorTypes.USER_NOT_AUTHORIZED)
                // emit authorization denied event
                this.identityEvents.authorizationDenied({
                    userId: userIdentity.userId,
                    action: action,
                    resource
                })
            
            throw new ApplicationError(ApplicationErrorTypes.USER_NOT_AUTHORIZED, {
                message: "User is not authorized to perform this action",
                details: {
                    userId: userIdentity.userId,
                    action: action
                }
            })
        }
	}
}

export default AuthorizeUser;
