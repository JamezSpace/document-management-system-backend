import Identity from "../../../domain/Identity.js";


/**
 * This is an abstraction of the repository layer that lies within application layer and actual implementation layer.
 *
 * All actual repositories (database layer) must implement this interface. 
 */
interface IdentityRepositoryPort {
    findByCredentials(email: string, password: string): Promise<Identity | null>;

    findIdentityByUid(uid: string): Promise<Identity | null>

	save(identity: Identity): Promise<void>;
}

export type { IdentityRepositoryPort };

