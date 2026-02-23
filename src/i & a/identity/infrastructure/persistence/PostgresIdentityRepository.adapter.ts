import type { IdentityRepositoryPort } from "../../application/ports/IdentityRepository.port.js";
import type Identity from "../../domain/Identity.js";

class PostgresqlIdentityRepositoryAdapter implements IdentityRepositoryPort {
    findByCredentials(email: string, password: string): Promise<Identity | null> {
        
    }

    findIdentityByUid(uid: string): Promise<Identity | null> {
        
    }

    save(identity: Identity): Promise<void> {
        
    }
}

export default PostgresqlIdentityRepositoryAdapter;