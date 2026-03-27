import type { PostgresDb } from "@fastify/postgres";
import type { WorkflowPolicyPort } from "../../../shared/application/port/WorkflowPolicy.port.js";
import type WorkflowStep from "../../../workflow/domain/entities/WorkflowStep.js";
import type {
	DocumentView,
	WorkflowDocumentPort,
} from "../../../shared/application/port/WorkflowDocumentPort.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";

class PostgresWorkflowDocumentAdapter implements WorkflowDocumentPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toInterface(row: any): DocumentView {
		return {
			id: row.id,
			ownerId: row.owner_id,
			unitId: row.unit_id,
			officeId: row.office_id,
			designationId: row.designation_id ?? null,
		};
	}

	async getDocumentById(documentId: string): Promise<DocumentView> {
		try {
			const query = `
				SELECT * FROM document.full_document_details WHERE id = $1;
			`;

            const result = await this.dbPool.query(query, [documentId]);

            return this.toInterface(result.rows[0]);
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

export default PostgresWorkflowDocumentAdapter;
