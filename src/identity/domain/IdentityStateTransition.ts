import DomainError from "../../shared/errors/DomainError.js";
import DomainErrorTypes from "../../shared/errors/types/DomainErrorTypes.js";
import {IdentityState} from "./IdentityState.js";

/**
 * This class contains methods that states business rules for identity and authority. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class IdentityTransition {
	static assertCanAuthenticate(currentState: IdentityState) {
		if (currentState === IdentityState.AUTHENTICATED)
			throw new DomainError(DomainErrorTypes.USER_ALREADY_AUTHENTICATED, {
				currentState,
				targetState: IdentityState.AUTHENTICATED,
			});
	}

	static assertIsAuthenticated(currentState: IdentityState) {
		if (currentState !== IdentityState.AUTHENTICATED)
			throw new DomainError(DomainErrorTypes.USER_NOT_AUTHENTICATED, {
				currentState,
				targetState: IdentityState.AUTHENTICATED,
			});
	}
}

export default IdentityTransition;
