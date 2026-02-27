import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { IdentityRepositoryPort } from "../../../application/ports/repos/IdentityRepository.port.js";
import Identity from "../../../domain/user/Identity.js";
import { IdentityStatus } from "../../../domain/user/IdentityStatus.js";

class PostgresqlIdentityRepositoryAdapter implements IdentityRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

    // helper function to rehydrate to Identity object
	private toIdentity(row: any): Identity {
		return new Identity({
			uid: row.id,
			authProviderId: row.auth_provider_id,
			firstName: row.firstname,
			lastName: row.lastname,
			middleName: row.middlename,
			email: row.email,
			status: row.status as IdentityStatus,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async updateIdentityStatus(
		uid: string,
		status: IdentityStatus,
	): Promise<Identity> {
		try {
			const result = await this.dbPool.query(
				"UPDATE identity.users SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, auth_provider_id, firstname, lastname, middlename, email, status, created_at, updated_at",
				[status, uid],
			);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Identity with uid ${uid} not found`,
					},
				);
			}

			const row = result.rows[0];

			return this.toIdentity(row);
		} catch (error) {
			console.log("error in postgres adapter", error);
			throw error;
		}
	}

	async findIdentityByAuthProviderId(
		authProviderId: string,
	): Promise<Identity | null> {
		try {
			const result = await this.dbPool.query(
				"SELECT id, auth_provider_id, firstname, lastname, middlename, email, status FROM identity.users WHERE auth_provider_id = $1 LIMIT 1",
				[authProviderId],
			);

			if (!result.rows || result.rows.length === 0) return null;

			const row = result.rows[0];

			// map DB row to domain
			return this.toIdentity(row);
		} catch (error) {
			console.log("error in postgres adapter", error);

			return null;
		}
	}

	async save(payload: {
		authProvider: string;
		identity: Identity;
	}): Promise<Identity> {
		try {
			const result = await this.dbPool.query(
				"INSERT INTO identity.users VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, auth_provider, auth_provider_id, email, firstname, lastname, middlename, status, created_at",
				[
					payload.identity.getUserId(),
					payload.authProvider,
					payload.identity.getAuthProviderId(),
					payload.identity.getEmail(),
					payload.identity.getFirstName(),
					payload.identity.getLastName(),
					payload.identity.getMiddleName(),
					payload.identity.getStatus(),
					payload.identity.getCreatedAt(),
				],
			);

			return result.rows[0];
		} catch (error: any) {
			console.log("error in identity repo adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.UNIQUE_CONSTRAINT_VIOLATION, {
				category: Category.PERSISTENCE,
				message: error.detail,
				table: error.table,
			});
		}
	}

	async findByCredentials(
		email: string,
		password: string,
	): Promise<Identity | null> {
		return null;
	}

	async findIdentityByUid(uid: string): Promise<Identity | null> {
		return null;
	}
}

export default PostgresqlIdentityRepositoryAdapter;
