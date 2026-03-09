import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { DocumentRepositoryPort } from "../../application/ports/repos/DocumentRepository.port.js";
import type Document from "../../domain/Document.js";
import DocumentEntity from "../../domain/Document.js";

class PostgresqlDocumentRepositoryAdapter implements DocumentRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): Document {
		return new DocumentEntity({
			id: row.id,
			ownerId: row.owner_id,
			title: row.title,
			version: null,
			referenceNumber: row.reference_number,
			correspondence: {
				originatingUnitId: row.originating_unit_id,
				recipientCode: row.recipient_code,
				subjectCode: row.subject_code_id,
			},
			classification: {
				sensitivity: row.sensitivity,
				businessFunctionId: row.business_function_id,
				documentType: row.document_type,
				classifiedBy: row.classified_by,
				classifiedAt: row.classified_at,
				lastReclassifiedAt: row.last_reclassified_at,
				lastReclassifiedBy: row.last_reclassified_by,
			},
			retention: {
				policyVersion: row.policy_version,
				retentionScheduleId: row.retention_schedule_id,
				retentionStartDate: row.retention_start_date,
				disposalEligibilityDate: row.disposal_eligibility_date,
				archivalRequired: row.archival_required,
			},
		});
	}

	async save(document: Document): Promise<Document> {
		try {
			const query = `
				INSERT INTO document.documents (
					id, title, owner_id, reference_number, current_version_id,
					originating_unit_id, recipient_code, subject_code_id,
					sensitivity, business_function_id, document_type,
					classified_by, classified_at, last_reclassified_at, last_reclassified_by,
					policy_version, retention_schedule_id, retention_start_date, disposal_eligibility_date, archival_required,
					created_at, updated_at
				)
				VALUES (
					$1, $2, $3, $4, $5,
					$6, $7, $8,
					$9, $10, $11,
					$12, $13, $14, $15,
					$16, $17, $18, $19, $20,
					now(), null
				)
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				document.id,
				document.title,
				document.ownerId,
				document.referenceNumber,
				document.getCurrentVersion()?.id ?? null,
				document.correspondence.originatingUnitId,
				document.correspondence.recipientCode,
				document.correspondence.subjectCode,
				document.classification.sensitivity,
				document.classification.businessFunctionId,
				document.classification.documentType,
				document.classification.classifiedBy,
				document.classification.classifiedAt,
				document.classification.lastReclassifiedAt ?? null,
				document.classification.lastReclassifiedBy ?? null,
				document.retention.policyVersion,
				document.retention.retentionScheduleId,
				document.retention.retentionStartDate,
				document.retention.disposalEligibilityDate,
				document.retention.archivalRequired,
			]);

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(
				postgresError.UNIQUE_CONSTRAINT_VIOLATION,
				{
					category: Category.PERSISTENCE,
					message: error.message,
					table: error.table,
					column: error.column,
				},
			);
		}
	}

	async findDocumentById(id: string): Promise<Document | null> {
		try {
			const query = "SELECT * FROM document.documents WHERE id = $1 LIMIT 1;";

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

	async editDocument(document: Document): Promise<Document | null> {
		try {
			const query = `
				UPDATE document.documents
				SET
					title = $2,
					owner_id = $3,
					reference_number = $4,
					current_version_id = $5,
					originating_unit_id = $6,
					recipient_code = $7,
					subject_code_id = $8,
					sensitivity = $9,
					business_function_id = $10,
					document_type = $11,
					classified_by = $12,
					classified_at = $13,
					last_reclassified_at = $14,
					last_reclassified_by = $15,
					policy_version = $16,
					retention_schedule_id = $17,
					retention_start_date = $18,
					disposal_eligibility_date = $19,
					archival_required = $20,
					updated_at = now()
				WHERE id = $1
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				document.id,
				document.title,
				document.ownerId,
				document.referenceNumber,
				document.getCurrentVersion()?.id ?? null,
				document.correspondence.originatingUnitId,
				document.correspondence.recipientCode,
				document.correspondence.subjectCode,
				document.classification.sensitivity,
				document.classification.businessFunctionId,
				document.classification.documentType,
				document.classification.classifiedBy,
				document.classification.classifiedAt,
				document.classification.lastReclassifiedAt ?? null,
				document.classification.lastReclassifiedBy ?? null,
				document.retention.policyVersion,
				document.retention.retentionScheduleId,
				document.retention.retentionStartDate,
				document.retention.disposalEligibilityDate,
				document.retention.archivalRequired,
			]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
				table: error.table,
				column: error.column,
			});
		}
	}

	async softDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"UPDATE document.documents SET updated_at = now() WHERE id = $1;",
			[id],
		);
	}

	async hardDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query("DELETE FROM document.documents WHERE id = $1;", [
			id,
		]);
	}

}

export default PostgresqlDocumentRepositoryAdapter;
