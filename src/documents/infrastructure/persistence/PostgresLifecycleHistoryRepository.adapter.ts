import type { PostgresDb } from "@fastify/postgres";
import type { LifecycleHistoryRepositoryPort } from "../../application/ports/repos/LifecycleHistoryRepository.port.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import LifecycleHistory from "../../domain/valueobjects/LifecycleHistory.js";

class PostgresLifecycleHistoryRepositoryAdapter implements LifecycleHistoryRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): LifecycleHistory {
		return new LifecycleHistory({
			action: row.action,
			actorId: row.actorId,
			documentId: row.documentId,
			fromState: row.fromState,
			id: row.id,
			toState: row.toState,
			documentVersionId: row.documentVersionId,
			metadata: row.metadata,
		});
	}

	async save(payload: LifecycleHistory): Promise<void> {
		try {
			const query = `INSERT INTO document.document_lifecycle_history VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW())`;

			const result = await this.dbPool.query(query, [
				payload.id,
				payload.documentId,
				payload.documentVersionId,
				payload.fromState,
				payload.toState,
				payload.action,
				payload.actorId,
				payload.metadata,
			]);

            // silence here is dangerous, the use cases using this method must be atomic. That is, if any part fails, nothing must be saved...
            
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}
}

export default PostgresLifecycleHistoryRepositoryAdapter;
