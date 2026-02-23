import DomainError from "../../../../shared/errors/enum/domain.enum.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import Role from "../../domain/role/Role.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { AccessRepositoryPort } from "../ports/AccessRepository.port.js";

class RevokeRole {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: AccessRepositoryPort;

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: AccessRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

	async revokeRole(payload: {
		staffId: string;
		role: Role;
		revokedBy: string;
	}) {
		const { staffId, role, revokedBy } = payload;

		const assignments =
				await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(
					staffId,
				),
			activeAssignment = assignments.find(
				(a) => a.role.name === role.name && a.isActive(),
			);


		if (!activeAssignment) {
			throw new AccessDomainError(DomainError.ROLE_NOT_ACTIVE);
		}

		// Close assignment (you may need a domain method instead)
		activeAssignment.close(new Date());

		await this.roleAssignmentRepo.save(activeAssignment);

		await this.authorityEvents.roleRevoked({
			userId: staffId,
			role,
			revokedBy,
			revokedAt: new Date(),
		});
	}
}

export default RevokeRole;
