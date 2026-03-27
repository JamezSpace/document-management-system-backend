import type WorkflowStep from "../../../workflow/domain/entities/WorkflowStep.js";

interface WorkflowPolicyPort {
	getApprovalSteps(documentId: string): Promise<WorkflowStep[]>;
}

export type { WorkflowPolicyPort };
