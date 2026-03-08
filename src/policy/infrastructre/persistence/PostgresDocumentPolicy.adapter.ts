import type { PostgresDb } from "@fastify/postgres";
import type { DocumentPolicyPort } from "../../../shared/application/port/documentPolicy.port.js";
import type { DocumentType } from "../../domain/enum/documentType.enum.js";

class PostgresDocumentPolicyAdapter implements DocumentPolicyPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async getRetentionData(documentType: DocumentType) {
		const result = await this.dbPool.query(
			`
      SELECT retention_duration
      FROM policy.documents
      WHERE document_type = $1
   `,
			[documentType],
		);

		return {
			duration: result.rows[0].retention_duration,
			archivalRequired: true,
		};
	}
}

export default PostgresDocumentPolicyAdapter;
