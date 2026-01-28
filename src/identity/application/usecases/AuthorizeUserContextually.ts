import ApplicationError from "../../../shared/errors/ApplicationError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import type Identity from "../../domain/Identity.js";
import { Action } from "../../domain/IdentityState.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.type.js";
import type { IdentityRepositoryPort } from "../ports/IdentityRepository.port.js";
import type { IdentityEventsPort } from "../ports/IdentityEvents.port.js";
import AuthorizationPolicy from "../../domain/authorization/AuthorizationPolicy.js";

class AuthorizeUserContextually {
	private readonly identityRepo: IdentityRepositoryPort;
	private readonly identityEvents: IdentityEventsPort;

	constructor(
		identityRepo: IdentityRepositoryPort,
		identityEvents: IdentityEventsPort,
	) {
		this.identityRepo = identityRepo;
		this.identityEvents = identityEvents;
	}

	async authorizeUser(
		userIdentity: Identity,
		action: Action,
		resource: AuthorizationResource,
	) {
        // evaluate authorization contextually
		const allowed = AuthorizationPolicy.canPerform(
			userIdentity,
			action,
			resource,
		);

        // deny authorization if not allowed
		if (!allowed) {
			await this.identityEvents.authorizationDenied({
				userId: userIdentity.userId,
				action,
				resource,
			});

			throw new ApplicationError(
				ApplicationErrorTypes.USER_NOT_AUTHORIZED,
				{
					message: "User is not authorized to perform this action",
					details: {
						userId: userIdentity.userId,
						action,
						resource,
					},
				},
			);
		}

        // grant authorization if allowed
		await this.identityEvents.authorizationGranted({
			userId: userIdentity.userId,
			action,
			resource,
		});
	}
}

export default AuthorizeUserContextually;
