import type { PostgresDb } from "@fastify/postgres";
import type { WorkflowPolicyPort } from "../../../shared/application/port/WorkflowPolicy.port.js";
import type WorkflowStep from "../../../workflow/domain/entities/WorkflowStep.js";
import type { DocumentView, WorkflowDocumentPort } from "../../../shared/application/port/WorkflowDocumentPort.js";

class PostgresWorkflowDocumentAdapter implements WorkflowDocumentPort {
	constructor(private readonly dbPool: PostgresDb) {}

    async getDocumentById(documentId: string): Promise<DocumentView> {
        throw new Error("Method not implemented.");
    }
}

export default PostgresWorkflowDocumentAdapter;
