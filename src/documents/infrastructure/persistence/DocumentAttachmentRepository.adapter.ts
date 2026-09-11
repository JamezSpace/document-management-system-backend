import type { PostgresDb } from "@fastify/postgres";
import type {
	DocumentAttachmentRecord,
	DocumentAttachmentRepositoryPort,
	SaveDocumentAttachmentPayload,
	UploadedMediaForAttachment,
} from "../../application/ports/repos/DocumentAttachmentRepository.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";

class DocumentAttachmentRepositoryAdapter implements DocumentAttachmentRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(payload: SaveDocumentAttachmentPayload, tx: TransactionContext): Promise<void> {
		try {
			await tx.client.query(
				`INSERT INTO document.document_attachments (
					id, parent_document_id, parent_document_version_id, source_type,
					source_document_id, source_document_version_id, media_id,
					attached_by, attached_at
				 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW());`,
				[
					payload.id,
					payload.parentDocumentId,
					payload.parentDocumentVersionId,
					payload.sourceType,
					payload.sourceDocumentId ?? null,
					payload.sourceDocumentVersionId ?? null,
					payload.mediaId ?? null,
					payload.attachedBy,
				],
			);
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

	async listByDocument(documentId: string): Promise<DocumentAttachmentRecord[]> {
		const result = await this.dbPool.query(
			`SELECT attachment.id, attachment.parent_document_id,
			        attachment.parent_document_version_id, attachment.source_type,
			        attachment.source_document_id, attachment.source_document_version_id,
			        source.title AS source_document_title,
			        source.reference_number AS source_document_reference_number,
			        source_version.version_number AS source_document_version_number,
			        attachment.media_id, media.mime_type, media.size_bytes, media.checksum,
			        attachment.attached_by, attachment.attached_at
			 FROM document.document_attachments attachment
			 LEFT JOIN document.documents source
			   ON source.id = attachment.source_document_id
			 LEFT JOIN document.document_versions source_version
			   ON source_version.id = attachment.source_document_version_id
			 LEFT JOIN media.media_assets media
			   ON media.id = attachment.media_id
			 WHERE attachment.parent_document_id = $1
			 ORDER BY attachment.display_order, attachment.attached_at, attachment.id;`,
			[documentId],
		);
		return result.rows.map((row) => ({
			id: row.id,
			parentDocumentId: row.parent_document_id,
			parentDocumentVersionId: row.parent_document_version_id,
			sourceType: row.source_type,
			sourceDocumentId: row.source_document_id,
			sourceDocumentVersionId: row.source_document_version_id,
			sourceDocumentTitle: row.source_document_title,
			sourceDocumentReferenceNumber: row.source_document_reference_number,
			sourceDocumentVersionNumber: row.source_document_version_number === null
				? null
				: Number(row.source_document_version_number),
			mediaId: row.media_id,
			mimeType: row.mime_type,
			sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
			checksum: row.checksum,
			attachedBy: row.attached_by,
			attachedAt: row.attached_at,
		}));
	}

	async remove(documentId: string, attachmentId: string, tx: TransactionContext): Promise<boolean> {
		const result = await tx.client.query(
			`DELETE FROM document.document_attachments
			 WHERE parent_document_id = $1
			   AND (id = $2 OR media_id = $2);`,
			[documentId, attachmentId],
		);
		return (result.rowCount ?? 0) > 0;
	}

	async findUploadedMedia(mediaId: string, tx: TransactionContext): Promise<UploadedMediaForAttachment | null> {
		const result = await tx.client.query(
			`SELECT id, format, mime_type, size_bytes, checksum, uploaded_by,
			        uploaded_by_type, is_active, virus_scan_status
			 FROM media.media_assets
			 WHERE id = $1
			 LIMIT 1;`,
			[mediaId],
		);
		if (!result.rows[0]) return null;
		const row = result.rows[0];
		return {
			id: row.id,
			format: row.format,
			mimeType: row.mime_type,
			sizeBytes: Number(row.size_bytes),
			checksum: row.checksum,
			uploadedBy: row.uploaded_by,
			uploadedByType: row.uploaded_by_type,
			isActive: row.is_active,
			virusScanStatus: row.virus_scan_status,
		};
	}

	async sourceVersionExists(documentId: string, versionId: string, tx: TransactionContext): Promise<boolean> {
		const result = await tx.client.query(
			`SELECT 1 FROM document.document_versions
			 WHERE document_id = $1 AND id = $2
			 LIMIT 1;`,
			[documentId, versionId],
		);
		return result.rows.length === 1;
	}

	async wouldCreateCycle(parentDocumentId: string, sourceDocumentId: string, tx: TransactionContext): Promise<boolean> {
		if (parentDocumentId === sourceDocumentId) return true;
		const result = await tx.client.query(
			`WITH RECURSIVE reachable(document_id) AS (
				SELECT $2::TEXT
				UNION
				SELECT attachment.source_document_id::TEXT
				FROM document.document_attachments attachment
				JOIN reachable ON attachment.parent_document_id = reachable.document_id
				WHERE attachment.source_type = 'internal_document'
			 )
			 SELECT 1 FROM reachable WHERE document_id = $1 LIMIT 1;`,
			[parentDocumentId, sourceDocumentId],
		);
		return result.rows.length === 1;
	}

	async filterEligibleInternalSources(parentDocumentId: string, candidateIds: string[]): Promise<Set<string>> {
		if (candidateIds.length === 0) return new Set();
		const result = await this.dbPool.query<{ candidate_id: string }>(
			`WITH RECURSIVE reachable(origin_id, document_id) AS (
				SELECT candidate.id, candidate.id
				FROM unnest($2::TEXT[]) AS candidate(id)
				UNION
				SELECT reachable.origin_id, attachment.source_document_id::TEXT
				FROM reachable
				JOIN document.document_attachments attachment
				  ON attachment.parent_document_id = reachable.document_id
				WHERE attachment.source_type = 'internal_document'
			 )
			 SELECT candidate.id AS candidate_id
			 FROM unnest($2::TEXT[]) AS candidate(id)
			 WHERE candidate.id <> $1
			   AND NOT EXISTS (
				 SELECT 1 FROM document.document_attachments existing
				 WHERE existing.parent_document_id = $1
				   AND existing.source_type = 'internal_document'
				   AND existing.source_document_id = candidate.id
			   )
			   AND NOT EXISTS (
				 SELECT 1 FROM reachable
				 WHERE reachable.origin_id = candidate.id
				   AND reachable.document_id = $1
			   );`,
			[parentDocumentId, candidateIds],
		);
		return new Set(result.rows.map((row) => row.candidate_id));
	}
}

export default DocumentAttachmentRepositoryAdapter;
