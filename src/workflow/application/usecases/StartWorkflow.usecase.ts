import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import type { WorkflowDocumentPort } from "../../../shared/application/port/WorkflowDocumentPort.js";
import type { WorkflowPolicyPort } from "../../../shared/application/port/WorkflowPolicy.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type WorkflowEngine from "../../domain/WorkflowEngine.service.js";
import type { WorkflowEventsPort } from "../port/events/WorkflowEvents.port.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";
import type { ApproverResolverServicePort } from "../port/services/ApproverResolverServicePort.js";

class StartWorkflowUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly worflowDocumentPort: WorkflowDocumentPort,
		private readonly workflowPolicyPort: WorkflowPolicyPort,
		private readonly workflowEngine: WorkflowEngine,
		private readonly approverResolverService: ApproverResolverServicePort,
		private readonly workflowRepository: WorkflowRepositoryPort,
        private readonly workflowEventsPort: WorkflowEventsPort
	) {}

	async execute(documentId: string) {
		// Fetch document
		const doc = await this.worflowDocumentPort.getDocumentById(documentId);

		if (!doc) {
			throw new ApplicationError(
				ApplicationErrorEnum.DOCUMENT_NOT_FOUND,
				{
					message: `Document with id ${documentId} doesn't exist.`,
				},
			);
		}

		//  Fetch policy steps
		const workflowSteps =
			await this.workflowPolicyPort.getApprovalSteps(documentId);

		if (!workflowSteps || workflowSteps.length === 0) {
			throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
				message: "No workflow policy defined for this document",
			});
		}

		// Prevent duplicate workflow
		const existingInstance =
			await this.workflowRepository.getInstanceByDocumentId(documentId);

		if (existingInstance) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: "Workflow already started for this document",
			});
		}

		// Create workflow instance
		const workflowInstance = this.workflowEngine.start(
			"WRKFLOW-" + this.idGenerator.generate(),
			documentId,
		);

		// Activate only first step
		const firstStep = workflowSteps[0]!;

        
        // Resolve approvers
		const userIds = await this.approverResolverService.resolve(
            doc,
			firstStep.role,
			firstStep.resolutionStrategy
		);
        
        if (!userIds || userIds.length === 0) {
            throw new ApplicationError(ApplicationErrorEnum.APPROVER_NOT_FOUND, {
                message: "No approvers resolved for first workflow step"
            });
        }

		// Create tasks
		const tasks = this.workflowEngine.createTasks(
			workflowInstance.id,
			firstStep,
			userIds
		);

        // persist everything
        await this.workflowRepository.saveInstance(workflowInstance);
		await this.workflowRepository.saveTasks(tasks);

        await this.workflowEventsPort.wrkflowAssigned({
            workflowInstanceId: workflowInstance.id,
            stepOrder: firstStep.stepOrder,
            role: firstStep.role,
            assignedTo: userIds,
            documentId,
        })


        // audit
        // await this.auditPort.log({
		// 	type: "WORKFLOW_STARTED",
		// 	actorId: doc.ownerId,
		// 	subjectId: documentId,
		// 	payload: {
		// 		workflowInstanceId: workflowInstance.id,
		// 		firstStep: firstStep.stepOrder,
		// 		assignedTo: userIds
		// 	}
		// });

		return {
			workflowInstanceId: workflowInstance.id,
			tasksCreated: tasks.length
		};
	}
}

export default StartWorkflowUseCase;
