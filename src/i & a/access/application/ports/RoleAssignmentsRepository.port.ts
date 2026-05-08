import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";

interface RoleAssignmentRepositoryPort {
    save(roleAssignment: RoleAssignment, tx?:TransactionContext): Promise<RoleAssignment>;

    findRoleAssignmentsByStaffId(staffId: string, tx?: TransactionContext): Promise<RoleAssignment[]>;
}

export type { RoleAssignmentRepositoryPort };

