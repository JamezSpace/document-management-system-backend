import type { RoleRepositoryPort } from "../../application/ports/RolesRepository.port.js";
import type Role from "../../domain/role/Role.js";

class PostgresqlRoleRepositoryAdapter implements RoleRepositoryPort {
    findAll(): Promise<Role[]> {
        
    }

    findById(id: string): Promise<Role | null> {
        
    }

    findByName(name: string): Promise<Role | null> {
        
    }

    save(role: Role): Promise<void> {
        
    }
}

export default PostgresqlRoleRepositoryAdapter;