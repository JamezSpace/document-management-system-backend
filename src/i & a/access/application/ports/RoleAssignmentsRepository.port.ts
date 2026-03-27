import type RoleAssignment from "../../domain/RoleAssignment.js";

interface RoleAssignmentRepositoryPort {
    save(roleAssignment: RoleAssignment): Promise<RoleAssignment>;

    findRoleAssignmentsByStaffId(staffId: string): Promise<RoleAssignment[]>;
}

export type { RoleAssignmentRepositoryPort };

