import Identity from "../../domain/Identity.js";
import type { IdentityRepositoryPort } from "../../application/ports/IdentityRepository.port.js";
import type { UserDetails } from "../../application/types/UserDetails.type.js";


/**
 * This is an implementation of the repository interface. In lay terms, plug in your actual database instance and implementation here and no where else.
 * 
 * By default, this is an in-memory implementation (data is stored in the store variable as a map).
 */
class InMemoryIdentityRepoAdapter implements IdentityRepositoryPort {
    private store = new Map<string, Identity>();
    private userStore = new Map<string, UserDetails>;

    async findByCredentials(email: string, password: string): Promise<UserDetails | null> {
        return this.userStore.get(email) ?? null;
    }

    async findIdentityByExternalAuthId(externalAuthId: string): Promise<Identity | null> {
        return this.store.get(externalAuthId) ?? null;
    }

    async save(identity: Identity): Promise<void> {
        this.store.set(identity.userId, identity);
    }
}

export default InMemoryIdentityRepoAdapter;