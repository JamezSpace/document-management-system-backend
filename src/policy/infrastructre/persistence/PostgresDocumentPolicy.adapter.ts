import type { PostgresDb } from "@fastify/postgres";
import type { DocumentType } from "../../../shared/application/enum/documentTypes.enum.js";
import type { DocumentRetentionPolicyPort } from "../../../shared/application/port/documentRetentionPolicy.port.js";
import type { DocumentRetentionPolicyRepositoryPort } from "../../application/port/repo/DocRetPolicyRepo.port.js";
import DocumentRetentionPolicy from "../../domain/DocumentRetentionPolicy.js";

class PostgresDocumentRetentionPolicyAdapter implements DocumentRetentionPolicyPort, DocumentRetentionPolicyRepositoryPort  {
	constructor(private readonly dbPool: PostgresDb) {}

	async getRetentionData(documentType: DocumentType) {
		const result = await this.dbPool.query(
			`SELECT policy_version, retention_duration, archival_required
            FROM policy.documents_retention
            WHERE document_type = $1 ORDER BY policy_version DESC`,
			[documentType],
		);

		const policyLoadedFromDb = result.rows[0];

		return {
			policyVersion: policyLoadedFromDb.policy_version,
			duration: policyLoadedFromDb.retention_duration,
			archivalRequired: policyLoadedFromDb.archival_required,
		};
	}

    private toDomain(row: any): DocumentRetentionPolicy {
        return new DocumentRetentionPolicy({
            id: row.id,
            archivalRequired: row.archival_required,
            documentType: row.document_type,
            effectiveFrom: row.effective_from,
            retentionDuration: row.retention_duration,
            createdAt: row.created_at,
            policyVersion: row.policy_version
        })
    }

    async save(documentRetentionPolicy: DocumentRetentionPolicy): Promise<DocumentRetentionPolicy> {
        const query = `INSERT INTO policy.document_retention_policies (id,document_type,policy_version,retention_duration,archival_required,effective_from)
        VALUES (
            $1, $2, policy.next_policy_version($2), $3, $4, $5
        );`

        const newPolicy = await this.dbPool.query(query, [
            documentRetentionPolicy.id, 
            documentRetentionPolicy.documentType,
            documentRetentionPolicy.retentionDuration,
            documentRetentionPolicy.archivalRequired,
            documentRetentionPolicy.effectiveFrom
        ])

        return this.toDomain(newPolicy.rows[0])
    }
}

export default PostgresDocumentRetentionPolicyAdapter;
