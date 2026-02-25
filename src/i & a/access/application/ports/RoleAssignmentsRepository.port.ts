import type RoleAssignment from "../../domain/RoleAssignment.js";

interface RoleAssignmentRepositoryPort {
    save(roleAssignment: RoleAssignment): Promise<void>;

    findRoleAssignmentsByStaffId(staffId: string): Promise<RoleAssignment[]>;

}

export type { RoleAssignmentRepositoryPort };

