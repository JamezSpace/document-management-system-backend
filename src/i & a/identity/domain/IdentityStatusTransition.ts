import DomainError from "../../../shared/errors/DomainError.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import { IdentityStatus } from "./IdentityStatus.js";

/**
 * This class contains methods that states business rules for identity and authority. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class IdentityTransition {
	// static assertCanAuthenticate(currentState: IdentityStatus) {
	// 	if (currentState === IdentityStatus.AUTHENTICATED)
	// 		throw new DomainError(
	// 			GlobalDomainErrors.identity_authority.identity
	// 				.USER_ALREADY_AUTHENTICATED,
	// 			{
	// 				currentState,
	// 				targetState: IdentityStatus.AUTHENTICATED,
	// 			},
	// 		);
	// }

	// static assertIsAuthenticated(currentState: IdentityStatus) {
	// 	if (currentState !== IdentityStatus.AUTHENTICATED)
	// 		throw new DomainError(
	// 			GlobalDomainErrors.identity_authority.identity
	// 				.USER_NOT_AUTHENTICATED,
	// 			{
	// 				currentState,
	// 				targetState: IdentityStatus.AUTHENTICATED,
	// 			},
	// 		);
	// }

	static assertCanActivate(currentState: IdentityStatus) {
		if (currentState !== IdentityStatus.PENDING)
			throw new DomainError(
				GlobalDomainErrors.identity_authority.identity.USER_NOT_ACTIVE,
				{
					currentState,
					targetState: IdentityStatus.ACTIVE,
				},
			);
	}

    static assertCanSuspend(currentState: IdentityStatus) {
        if(currentState !== IdentityStatus.ACTIVE)
            throw new DomainError(
				GlobalDomainErrors.identity_authority.identity.USER_NOT_ACTIVE,
				{
					currentState,
					targetState: IdentityStatus.SUSPENDED,
				},
			);
    }
}

export default IdentityTransition;
