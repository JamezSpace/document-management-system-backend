import Identity from "../../../../domain/entities/user/Identity.js";

/**
 * This is an abstraction of the repository layer that lies within application layer and actual implementation layer.
 *
 * All actual repositories (database layer) must implement this interface.
 */
interface UserRepositoryPort {
	findByCredentials(
		email: string,
		password: string,
	): Promise<Identity | null>;

	findIdentityByUid(uid: string): Promise<Identity | null>;

	findIdentityByAuthProviderId(authProviderId: string): Promise<Identity | null>

	save(payload: {
		authProvider: string;
		identity: Identity;
	}): Promise<Identity>;

    updateIdentityStatus(uid: string, status: string): Promise<Identity>;
}

export type { UserRepositoryPort };

