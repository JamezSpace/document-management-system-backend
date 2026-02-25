import type { RoleAssignmentRepositoryPort } from "../../application/ports/RoleAssignmentsRepository.port.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";

class PostgresqlRoleAssignmentRepositoryAdapter implements RoleAssignmentRepositoryPort {
    findRoleAssignmentsByStaffId(staffId: string): Promise<RoleAssignment[]> {
        
    }

    save(roleAssignment: RoleAssignment): Promise<void> {
        
    }
}

export default PostgresqlRoleAssignmentRepositoryAdapter;