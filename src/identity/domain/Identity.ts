import DomainError from "../../shared/errors/DomainError.js";
import DomainErrorTypes from "../../shared/errors/types/DomainErrorTypes.js";
import { IdentityState, Action } from "./IdentityState.js";
import IdentityTransition from "./IdentityStateTransition.js";

interface IdentityDTO {
	userId: string;
	roles: string[];
	initialState: IdentityState;
}

class Identity {
	readonly userId: string;
	readonly roles: Set<string>;
	readonly createdAt: Date;
	private state: IdentityState;

	constructor(identity: IdentityDTO) {
		this.userId = identity.userId;
		this.roles = new Set(identity.roles);
		this.createdAt = new Date();
		this.state = identity.initialState;
	}

	public getState(): IdentityState {
		return this.state;
	}

	public authenticate() {
		IdentityTransition.assertCanAuthenticate(this.state);

		this.state = IdentityState.AUTHENTICATED;
	}

	// this is for implicit authorization. Implicit authorization means that the user is authorized by virtue of being authenticated, take note, it is not resource specific. Classic example is access to a dashboard after login but contextual authroization is required to access specific resources within the dashboard and that demands a Policy evaluation

	public isAuthenticated(): boolean {
		return this.state === IdentityState.AUTHENTICATED;
	}

	public hasRole(role: string): boolean {
		return this.roles.has(role);
	}
}

export default Identity;
