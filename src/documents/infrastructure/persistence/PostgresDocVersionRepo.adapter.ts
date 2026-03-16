import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { DocumentVersionRepositoryPort } from "../../application/ports/repos/DocumentVersionRepository.port.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import DocumentVersion from "../../domain/entities/document/DocumentVersion.js";

class PostgresDocVersionRepositoryAdapter implements DocumentVersionRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DocumentVersion {
		return new DocumentVersion({
			id: row.id,
			documentId: row.document_id,
			versionNumber: row.version_number,
			mediaId: row.media_id,
			lifecycle: {
				currentState: row.lifecycle_state,
				stateEnteredAt: row.created_at,
				stateEnteredBy: row.created_by,
			},
		});
	}

	async save(document: DocumentVersion): Promise<DocumentVersion> {
		try {
			const query = `
				INSERT INTO documents.document_versions (
					id, document_id, version_number, media_id, created_at, created_by, lifecycle_state
				) VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				document.id,
				document.documentId,
				document.versionNumber,
				document.mediaId,
				document.lifecycle.stateEnteredAt,
				document.lifecycle.stateEnteredBy,
				document.lifecycle.currentState,
			]);

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(
				postgresError.summary,
				{
					category: Category.PERSISTENCE,
					message: postgresError.details?.message ?? error.message,
					table: postgresError.details?.table,
					column: postgresError.details?.column,
				},
			);
		}
	}

	async findVersionedDocumentById(id: string): Promise<DocumentVersion | null> {
		try {
			const query = "SELECT * FROM documents.document_versions WHERE id = $1 LIMIT 1;";
			const result = await this.dbPool.query(query, [id]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async editVersionedDocument(
		document: DocumentVersion,
	): Promise<DocumentVersion | null> {
		try {
			const query = `
				UPDATE documents.document_versions
				SET
					document_id = $2,
					version_number = $3,
					media_id = $4,
					created_at = $5,
					created_by = $6,
					lifecycle_state = $7
				WHERE id = $1
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				document.id,
				document.documentId,
				document.versionNumber,
				document.mediaId,
				document.lifecycle.stateEnteredAt,
				document.lifecycle.stateEnteredBy,
				document.lifecycle.currentState,
			]);

			if (!result.rows || result.rows.length === 0) return null;

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

	async softDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"UPDATE documents.document_versions SET lifecycle_state = $2 WHERE id = $1;",
			[id, LifecycleState.CANCELLED],
		);
	}

	async hardDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"DELETE FROM documents.document_versions WHERE id = $1;",
			[id],
		);
	}
}

export default PostgresDocVersionRepositoryAdapter;
