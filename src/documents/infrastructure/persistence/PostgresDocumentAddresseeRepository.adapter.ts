import type { PostgresDb } from "@fastify/postgres";
import type { DocumentAddresseeRepositoryPort } from "../../application/ports/repos/DocumentAddresseeRepository.port.js";
import type DocumentAddressee from "../../domain/valueobjects/DocumentAddressee.js";
import DocumentAddresseeEntity from "../../domain/valueobjects/DocumentAddressee.js";
import type { DocumentAddresseePayload } from "../../domain/valueobjects/DocumentAddressee.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class PostgresDocumentAddresseeRepositoryAdapter
	implements DocumentAddresseeRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DocumentAddressee {
		return new DocumentAddresseeEntity({
			documentId: row.document_id,
			recipientUnitId: row.recipient_unit_id,
			addressedToDesignationId: row.addressed_to_designation_id,
		});
	}

	async save(
		payload: DocumentAddresseePayload,
		tx?: TransactionContext,
	): Promise<DocumentAddressee> {
		try {
			const query = `
				INSERT INTO document.document_addressee (
					document_id,
					recipient_unit_id,
					addressed_to_designation_id
				)
				VALUES ($1, $2, $3)
				ON CONFLICT (
					document_id,
					recipient_unit_id,
					addressed_to_designation_id
				)
				DO UPDATE SET
					document_id = EXCLUDED.document_id,
					recipient_unit_id = EXCLUDED.recipient_unit_id,
					addressed_to_designation_id = EXCLUDED.addressed_to_designation_id
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.documentId,
				payload.recipientUnitId,
				payload.addressedToDesignationId,
			]);

			return this.toDomain(result.rows[0]);
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

	async fetchAll(): Promise<DocumentAddressee[]> {
		try {
			const query = `
				SELECT *
				FROM document.document_addressee
				ORDER BY document_id, recipient_unit_id, addressed_to_designation_id;
			`;

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toDomain(row));
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

	async editDocAddressee(
		payload: {
			documentId: string;
			editsToMake: Omit<
				DocumentAddresseePayload,
				"documentId" | "recipientUnitId"
			>;
		},
		tx?: TransactionContext,
	): Promise<DocumentAddressee | null> {
		try {
			const query = `
				UPDATE document.document_addressee
				SET addressed_to_designation_id = $2
				WHERE document_id = $1
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.documentId,
				payload.editsToMake.addressedToDesignationId,
			]);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Document addressee for ${payload.documentId} not found.`,
					},
				);
			}

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			if (error instanceof InfrastructureError) throw error;

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

export default PostgresDocumentAddresseeRepositoryAdapter;
