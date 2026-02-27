import type { IdentityRepositoryPort } from "../../../application/ports/repos/IdentityRepository.port.js";
import Identity from "../../../domain/user/Identity.js";


/**
 * This is an implementation of the repository interface. In lay terms, plug in your actual database instance and implementation here and no where else.
 * 
 * By default, this is an in-memory implementation (data is stored in the store variable as a map).
 */
class InMemoryIdentityRepoAdapter implements IdentityRepositoryPort {
    private store = new Map<string, Identity>();

    async findByCredentials(email: string, password: string): Promise<Identity | null> {
        return this.store.get(email) ?? null;
    }

    async findIdentityByUid(uid: string): Promise<Identity | null> {
        return this.store.get(uid) ?? null;
    }

    async save(identity: Identity): Promise<void> {
        this.store.set(identity.getUserId(), identity);
    }
}

export default InMemoryIdentityRepoAdapter;