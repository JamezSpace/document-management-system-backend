import { GlobalDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import type Role from "../../domain/role/Role.js";
import RoleAssignment from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class AssignOfficialRole {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort;

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: RoleAssignmentRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

	async assignOfficialRole(staffId: string, role: Role) {
        // check if officeial role has been assigned previously
		const assignments =
				await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(
					staffId,
				),
			activeAssignments = assignments.filter((a) => a.isActive());

		const hasOfficialRole = activeAssignments.some((a) => !a.delegatedBy);

		if (hasOfficialRole) {
			throw new AccessDomainError(
				GlobalDomainErrors.identity_authority.access.OFFICIAL_ROLE_ALREADY_ASSIGNED
			);
		}

		// create assignment
		const assignment = new RoleAssignment({
			identityId: staffId,
			role,
			validFrom: new Date(),
		});

		// persist to the database
		await this.roleAssignmentRepo.save(assignment);

        await this.authorityEvents.officialRoleAssigned({
            userId: staffId,
            role: role,
            assignedAt: new Date()
        })
	}
}

export default AssignOfficialRole;
