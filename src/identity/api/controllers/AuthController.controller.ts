import AuthenticateUser from "../../application/usecases/AuthenticateUser.js";
import type { AuthenticateUserRequest } from "../types/AuthenticateUserRequest.js";
import AuthorizeUserImplicitly from "../../application/usecases/AuthorizeUserImplicitly.js";
import type AuthorizeUserContextually from "../../application/usecases/AuthorizeUserContextually.js";
import type Identity from "../../domain/Identity.js";
import type { Action } from "../../domain/IdentityState.js";
import type { AuthorizationResource } from "../../application/types/AuthorizationResource.type.js";

class AuthController {
	private readonly authenticateUser: AuthenticateUser;
	private readonly implicitAuthority: AuthorizeUserImplicitly;
	private readonly contextualAuthority: AuthorizeUserContextually;

	constructor(
		private unauthenticatedUser: AuthenticateUser,
		private authorizeUserImplicit: AuthorizeUserImplicitly,
		private authorizeUserContextual: AuthorizeUserContextually,
	) {
		this.authenticateUser = unauthenticatedUser;
		this.implicitAuthority = authorizeUserImplicit;
		this.contextualAuthority = this.authorizeUserContextual;
	}

	async authenticate(authenticateUser: AuthenticateUserRequest) {
		const userId = await this.authenticateUser.authenticateUser({
			externalUser: {
				externalAuthId: authenticateUser.externalAuthId,
			},
		});

		return {
			userId,
		};
	}

	async authorizeImplicitly(userIdentity: Identity) {
		await this.implicitAuthority.authorizeUser(userIdentity);

		return { authorized: true, userId: userIdentity.userId };
	}

	async authorizeContextually(
		userIdentity: Identity,
		action: Action,
		resource: AuthorizationResource,
	) {
		await this.contextualAuthority.authorizeUser(
			userIdentity,
			action,
			resource,
		);

		return {
			authorized: true,
			userId: userIdentity.userId,
			action,
			resource,
		};
	}
}

export default AuthController;
