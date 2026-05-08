import { GlobalDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import type Role from "../../domain/role/Role.js";
import RoleAssignment, { RoleAssignmentSource } from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class AssignOfficialRoleUseCase {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort;
	private readonly baseRoleId = "role.staff_member";

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: RoleAssignmentRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

	async execute(payload: {staffId: string, role: Role}, tx?: TransactionContext) {
        // check if official role has been assigned previously
		const assignments =
				await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(
					payload.staffId,
                    tx
				),
			activeAssignments = assignments.filter((a) => a.isActive());

		if (
			payload.role.getId() === this.baseRoleId &&
			activeAssignments.some((a) => a.role.getId() === this.baseRoleId)
		) {
			return;
		}

		const hasOfficialRole = activeAssignments.some(
			(a) => !a.delegatedBy && a.role.getId() !== this.baseRoleId,
		);

		if (hasOfficialRole) {
			throw new AccessDomainError(
				GlobalDomainErrors.identity_authority.access.OFFICIAL_ROLE_ALREADY_ASSIGNED
			);
		}

		// create assignment
		const assignment = new RoleAssignment({
			identityId: payload.staffId,
			role: payload.role,
			validFrom: new Date(),
            source: RoleAssignmentSource.DERIVED
		});

		// persist to the database
		const roleAssigned = await this.roleAssignmentRepo.save(assignment, tx);

        if(roleAssigned)
            await this.authorityEvents.officialRoleAssigned({
                staffId: payload.staffId,
                role: payload.role,
            })
	}
}

export default AssignOfficialRoleUseCase;
