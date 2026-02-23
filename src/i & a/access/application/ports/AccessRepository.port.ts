import type RoleAssignment from "../../domain/RoleAssignment.js";

interface AccessRepositoryPort {
    save(roleAssignment: RoleAssignment): Promise<void>;

    findRoleAssignmentsByStaffId(staffId: string): Promise<RoleAssignment[]>;

}

export type { AccessRepositoryPort };
