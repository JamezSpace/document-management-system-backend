import ApplicationError from "../../../shared/errors/ApplicationError.js";
import ApplicationErrorTypes from "../../../shared/errors/types/ApplicationErrorTypes.js";
import type Identity from "../../domain/Identity.js";
import type { IdentityEventsPort } from "../ports/IdentityEvents.port.js";

class AuthorizeUserImplicitly {
	private identityEvents: IdentityEventsPort;

	constructor(private identityEventBus: IdentityEventsPort) {
		this.identityEvents = identityEventBus;
	}

	async authorizeUser(userIdentity: Identity) {
		// verify if user is authenticated (implicit logic)
		if (!userIdentity.isAuthenticated()) {
			// emit authorization denied event
			await this.identityEvents.implicitAuthorizationDenied({
				userId: userIdentity.userId,
				timestamp: new Date(),
			});

			throw new ApplicationError(
				ApplicationErrorTypes.USER_NOT_AUTHENTICATED,
				{
					message:
						"User must be authenticated to be implicitly authorized",
					details: {
						userId: userIdentity.userId,
					},
				},
			);
		}

		// emit authorization granted event
		await this.identityEvents.implicitAuthorizationGranted({
			userId: userIdentity.userId,
            timestamp: new Date()
		});
	}
}

export default AuthorizeUserImplicitly;
