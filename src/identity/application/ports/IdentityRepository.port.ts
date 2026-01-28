import Identity from "../../domain/Identity.js";
import type { UserDetails } from "../types/UserDetails.type.js";

/**
 * This is an abstraction of the repository layer that lies within application layer and actual implementation layer.
 *
 * All actual repositories (database layer) must implemennt this interface. 
 */
interface IdentityRepositoryPort {
    findByCredentials(email: string, password: string): Promise<UserDetails | null>;

    findIdentityByExternalAuthId(externalAuthId: string): Promise<Identity | null>

	save(identity: Identity): Promise<void>;
}

export type { IdentityRepositoryPort };
