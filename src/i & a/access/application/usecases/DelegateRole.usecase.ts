import type Role from "../../domain/role/Role.js";
import RoleAssignment from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { AccessRepositoryPort } from "../ports/AccessRepository.port.js";

class DelegateRole {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: AccessRepositoryPort;

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: AccessRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

	async delegateRole(payload: {
		staffId: string;
		role: Role;
		delegatedBy: string;
		validTo: Date;
	}) {
		const { staffId, role, delegatedBy, validTo } = payload;

		// create RoleAssignment (domain enforces invariants)
		const assignment = new RoleAssignment({
			identityId: staffId,
			role,
			validFrom: new Date(),
			delegatedBy,
			validTo,
		});

		// persist
		await this.roleAssignmentRepo.save(assignment);

		// emit event
		await this.authorityEvents.roleDelegated({
			userId: staffId,
			role: role,
			delegatedBy,
			validTo,
			assignedAt: new Date(),
		});
	}
}

export default DelegateRole;
