import type { PostgresDb } from "@fastify/postgres";
import type {
	DocumentSignatureRecord,
	DocumentSignatureRepositoryPort,
	RecordUnitHeadSignaturePayload,
	ActiveStaffSignatureMedia,
} from "../../application/ports/repos/DocumentSignatureRepository.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

const signatureSelect = `
	SELECT signature.id, signature.document_id, signature.document_version_id,
		signature.signed_revision, signature.content_sha256, signature.signed_by,
		COALESCE(signature.signer_name,
			NULLIF(CONCAT_WS(' ', signer_user.first_name, signer_user.middle_name, signer_user.last_name), '')
		) AS signer_name,
		COALESCE(signature.signer_designation, designation.title) AS signer_designation,
		signature.signed_at, signature.signature_media_id,
		media.object_key AS signature_object_key, media.format AS signature_format,
		media.mime_type AS signature_mime_type, media.checksum AS signature_checksum,
		signature.revoked_by, signature.revoked_at, signature.revocation_reason,
		signature.invalidated_at, signature.invalidation_reason
	FROM document.document_unit_head_signatures signature
	JOIN identity.staff signer ON signer.id = signature.signed_by
	JOIN identity.users signer_user ON signer_user.id = signer.identity_id
	LEFT JOIN identity.designations designation ON designation.id = signer.designation_id
	LEFT JOIN media.media_assets media ON media.id = signature.signature_media_id`;

class DocumentSignatureRepositoryAdapter implements DocumentSignatureRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toRecord(row: any): DocumentSignatureRecord {
		const status = row.revoked_at ? "revoked" : row.invalidated_at ? "invalidated" : "signed";
		return {
			id: row.id,
			documentId: row.document_id,
			documentVersionId: row.document_version_id,
			signedRevision: row.signed_revision === null ? null : Number(row.signed_revision),
			contentSha256: row.content_sha256,
			signedBy: row.signed_by,
			signerName: row.signer_name,
			signerDesignation: row.signer_designation,
			signedAt: row.signed_at,
			signatureMedia: row.signature_media_id ? {
				id: row.signature_media_id,
				objectKey: row.signature_object_key,
				format: row.signature_format,
				mimeType: row.signature_mime_type,
				checksum: row.signature_checksum,
			} : null,
			revokedBy: row.revoked_by,
			revokedAt: row.revoked_at,
			revocationReason: row.revocation_reason,
			invalidatedAt: row.invalidated_at,
			invalidationReason: row.invalidation_reason,
			status,
		};
	}

	async findActiveStaffSignatureMedia(staffId: string, tx?: TransactionContext): Promise<ActiveStaffSignatureMedia | null> {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`SELECT media.id, media.object_key, media.format, media.mime_type, media.checksum,
				NULLIF(CONCAT_WS(' ', staff_user.first_name, staff_user.middle_name, staff_user.last_name), '') AS signer_name,
				designation.title AS signer_designation
			 FROM identity.staff_media_assets staff_media
			 JOIN identity.staff staff ON staff.id = staff_media.staff_id
			 JOIN identity.users staff_user ON staff_user.id = staff.identity_id
			 LEFT JOIN identity.designations designation ON designation.id = staff.designation_id
			 JOIN media.media_assets media ON media.id = staff_media.media_id
			 WHERE staff_media.staff_id = $1
				AND upper(staff_media.asset_role) = 'SIGNATURE'
				AND staff_media.is_active = TRUE
			 ORDER BY staff_media.assigned_at DESC
			 LIMIT 1;`,
			[staffId],
		);
		const row = result.rows[0];
		return row ? {
			id: row.id, objectKey: row.object_key, format: row.format,
			mimeType: row.mime_type, checksum: row.checksum,
			signerName: row.signer_name, signerDesignation: row.signer_designation,
		} : null;
	}

	async findEffectiveByDocument(documentId: string, documentVersionId: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`${signatureSelect}
			 WHERE signature.document_id = $1
				AND signature.document_version_id = $2
				AND signature.revoked_at IS NULL
				AND signature.invalidated_at IS NULL
			 ORDER BY signature.signed_at DESC LIMIT 1;`,
			[documentId, documentVersionId],
		);
		return result.rows[0] ? this.toRecord(result.rows[0]) : null;
	}

	async findById(signatureId: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(`${signatureSelect} WHERE signature.id = $1 LIMIT 1;`, [signatureId]);
		return result.rows[0] ? this.toRecord(result.rows[0]) : null;
	}

	async listByDocument(documentId: string) {
		const result = await this.dbPool.query(
			`${signatureSelect} WHERE signature.document_id = $1 ORDER BY signature.signed_at DESC, signature.id DESC;`,
			[documentId],
		);
		return result.rows.map((row) => this.toRecord(row));
	}

	async invalidateOutdated(documentId: string, documentVersionId: string, contentSha256: string, invalidatedAt: Date, tx: TransactionContext) {
		await tx.client.query(
			`UPDATE document.document_unit_head_signatures
			 SET invalidated_at = $4, invalidation_reason = 'document_content_version_changed'
			 WHERE document_id = $1
				AND (document_version_id IS DISTINCT FROM $2 OR content_sha256 IS DISTINCT FROM $3)
				AND revoked_at IS NULL AND invalidated_at IS NULL;`,
			[documentId, documentVersionId, contentSha256, invalidatedAt],
		);
	}

	async recordUnitHeadSignature(payload: RecordUnitHeadSignaturePayload, tx: TransactionContext) {
		const result = await tx.client.query(
			`INSERT INTO document.document_unit_head_signatures
				(id, document_id, document_version_id, signed_revision, content_sha256,
				 signature_media_id, signer_name, signer_designation, signed_by, signed_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			 RETURNING id;`,
			[payload.id, payload.documentId, payload.documentVersionId, payload.signedRevision,
				payload.contentSha256, payload.signatureMediaId, payload.signerName,
				payload.signerDesignation, payload.signedBy, payload.signedAt],
		);
		return (await this.findById(result.rows[0].id, tx))!;
	}

	async revoke(signatureId: string, documentId: string, revokedBy: string, revokedAt: Date, reason: string, tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE document.document_unit_head_signatures
			 SET revoked_by = $3, revoked_at = $4, revocation_reason = $5
			 WHERE id = $1 AND document_id = $2
				AND revoked_at IS NULL AND invalidated_at IS NULL;`,
			[signatureId, documentId, revokedBy, revokedAt, reason],
		);
		return (result.rowCount ?? 0) === 1;
	}
}

export default DocumentSignatureRepositoryAdapter;
