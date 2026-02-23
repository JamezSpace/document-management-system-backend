import type { User } from "../api/types/user.type.js";
import { IdentityStatus } from "./IdentityStatus.js";
import IdentityTransition from "./IdentityStatusTransition.js";


class Identity {
	private readonly userId: string;
    private readonly roleId: string;
	private readonly createdAt: Date;
	private status: IdentityStatus;

	constructor(payload: User) {
		this.userId = payload.uid;
        this.status = payload.status;
        this.createdAt = new Date();
        this.roleId = payload.role
	}

    getUserId():string {
        return this.userId;
    }

	getStatus(): IdentityStatus {
		return this.status;
	}

	activate() {
		IdentityTransition.assertCanActivate(this.status)
		this.status = IdentityStatus.ACTIVE;
	}

	suspend() {
        IdentityTransition.assertCanSuspend(this.status)
		this.status = IdentityStatus.SUSPENDED;
	}

	isActive(): boolean {
		return this.status === IdentityStatus.ACTIVE;
	}

}

export default Identity;
