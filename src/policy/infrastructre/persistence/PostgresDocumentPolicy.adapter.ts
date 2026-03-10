import type { PostgresDb } from "@fastify/postgres";
import type { DocumentPolicyPort } from "../../../shared/application/port/documentPolicy.port.js";
import type { DocumentType } from "../../domain/enum/documentType.enum.js";

class PostgresDocumentPolicyAdapter implements DocumentPolicyPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async getRetentionData(documentType: DocumentType) {
		const result = await this.dbPool.query(
			`SELECT policy_version, retention_duration, archival_required
            FROM policy.documents
            WHERE document_type = $1`,
			[documentType],
		);

		const policyLoadedFromDb = result.rows[0];

		return {
			policyVersion: policyLoadedFromDb.policy_version,
			duration: policyLoadedFromDb.retention_duration,
			archivalRequired: true,
		};
	}
}

export default PostgresDocumentPolicyAdapter;
