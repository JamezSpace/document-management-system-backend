import { IdentityState } from "./IdentityState.js";
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

	public isAuthenticated(): boolean {
		return this.state === IdentityState.AUTHENTICATED;
	}

	public hasRole(role: string): boolean {
		return this.roles.has(role);
	}
}

export default Identity;
