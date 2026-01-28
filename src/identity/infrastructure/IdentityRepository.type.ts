import Identity from "../domain/Identity.js";
import type { UserDetails } from "./types/UserDetails.type.js";

/**
 * This is an abstraction of the repository layer that lies within application layer and actual implementation layer.
 *
 * All actual repositories (database layer) must implemennt this interface. 
 */
interface IdentityRepository {
    findByCredentials(email: string, password: string): Promise<UserDetails | null>;

	findBySessionId(sessionId: string): Promise<Identity | null>;

    findIdentityByExternalAuthId(externalAuthId: string): Promise<Identity | null>

	save(identity: Identity): Promise<void>;
}

export type { IdentityRepository };
