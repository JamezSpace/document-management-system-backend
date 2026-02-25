import type Permission from "../../domain/permission/Permission.js";
import type Role from "../../domain/role/Role.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class GetEffectivePermissionsUseCase {
	constructor(
		private readonly authorityEvents: AccessEventsPort,
		private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort
	) {}

	async getEffectivePermissions(staffId: string) {
		const assignments =
				await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(
					staffId,
				),
			activeAssignments = assignments.filter((a) => a.isActive());

		const rolePermissionMap = new Map<
			string,
			{ role: Role; permissions: Permission[] }
		>();

		activeAssignments.forEach((assignment) => {
			const role = assignment.role;
			const roleId = role.getId();

			if (!rolePermissionMap.has(roleId)) {
				rolePermissionMap.set(roleId, {
					role,
					permissions: [...role.getPermissions()],
				});
			}
		});

		return Array.from(rolePermissionMap.values());
	}
}

export default GetEffectivePermissionsUseCase;
