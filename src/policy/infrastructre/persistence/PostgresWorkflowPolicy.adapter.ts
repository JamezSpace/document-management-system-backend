import type { PostgresDb } from "@fastify/postgres";
import type { WorkflowPolicyPort } from "../../../shared/application/port/WorkflowPolicy.port.js";
import type WorkflowStep from "../../../workflow/domain/entities/WorkflowStep.js";

class PostgresWorkflowPolicyAdapter implements WorkflowPolicyPort{
    constructor(private readonly dbPool: PostgresDb) {}

    async getApprovalSteps(documentId: string): Promise<WorkflowStep[]> {
        throw new Error("Method not implemented.");
    }
}

export default PostgresWorkflowPolicyAdapter;