import type Permission from "../../domain/permission/Permission.js";
import PermissionResolver from "../../domain/PermissionResolver.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";
import type { AuthorizationResource } from "../types/AuthorizationResource.type.js";

class AuthorizeAction {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort;

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: RoleAssignmentRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

    async authorizeAction(payload: {
        staffId: string,
        permission: Permission,
        resource: AuthorizationResource
    }) {
        const { staffId, permission, resource } = payload;

    const assignments =
      await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(staffId);

    const resolver = new PermissionResolver({
      identityId: staffId,
      permission,
      rolesAssigned: assignments,
    });

    const granted = resolver.identityHasPermission();

    if (granted) {
      await this.authorityEvents.authorizationGranted({
        userId: staffId,
        permission,
        resource,
        timestamp: new Date(),
      });
    } else {
      await this.authorityEvents.authorizationDenied({
        userId: staffId,
        permission,
        resource,
        timestamp: new Date(),
      });
    }

    return granted;
    }
}

export default AuthorizeAction;