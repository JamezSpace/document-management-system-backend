import type { AccessRepositoryPort } from "../../application/ports/AccessRepository.port.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";

class PostgresqlAccesRepositoryAdapter implements AccessRepositoryPort {
    findRoleAssignmentsByStaffId(staffId: string): Promise<RoleAssignment[]> {
        
    }

    save(roleAssignment: RoleAssignment): Promise<void> {
        
    }
}

export default PostgresqlAccesRepositoryAdapter;