import type Role from "../../domain/role/Role.js";

interface AccessEventsPort {
	officialRoleAssigned(payload: {
		userId: string;
		role: Role;
	}): Promise<void>;

	roleDelegated(payload: {
		userId: string;
		role: Role;
		delegatedBy: string;
		validTo: Date;
	}): Promise<void>;

	roleRevoked(payload: {
		userId: string;
		role: Role;
        revokedBy: string;
	}): Promise<void>;
}

export type { AccessEventsPort };

