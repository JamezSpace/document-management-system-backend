import type { WorkflowDocumentPort } from "../../../shared/application/port/WorkflowDocumentPort.js";
import type { WorkflowPolicyPort } from "../../../shared/application/port/WorkflowPolicy.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type WorkflowEngine from "../../domain/WorkflowEngine.service.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";
import type { ApproverResolverServicePort } from "../port/services/ApproverResolverServicePort.js";

class ApproveTaskUseCase {
	constructor(
		private readonly workflowRepository: WorkflowRepositoryPort,
		private readonly workflowPolicyPort: WorkflowPolicyPort,
		private readonly workflowDocumentPort: WorkflowDocumentPort,
		private readonly workflowEngine: WorkflowEngine,
		private readonly approverResolver: ApproverResolverServicePort,
		// private readonly auditPort: AuditPort
	) {}

	async execute(taskId: string, actorId: string) {
		// get task
		const task = await this.workflowRepository.getTaskById(taskId);

		if (!task) {
			throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
				message: "Task not found"
			});
		}

		// validate task is actionable
		if (!task.canBeActionedBy(actorId)) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, {
				message: "You are not allowed to approve this task"
			});
		}

		if (!task.isPending()) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Task already processed"
			});
		}

		// approve task
		task.approve(actorId);

		// get workflow instance
		const instance = await this.workflowRepository.getInstanceByDocumentId(task.workflowInstanceId);

		if (!instance) {
			throw new ApplicationError(ApplicationErrorEnum.WRKFLOW_NOT_FOUND, {
				message: "Workflow instance not found"
			});
		}

		// 5. Get all tasks for current step
		const stepTasks = await this.workflowRepository.getTasksByStep(
			instance.id,
			task.stepOrder
		);

		// 6. Check if step is complete
		const isStepComplete = this.workflowEngine.isStepComplete(stepTasks);

		if (!isStepComplete) {
			// persist only this task update
			await this.workflowRepository.updateTask(task);

			return { message: "Task approved. Waiting for other approvers." };
		}

		// 7. Move to next step
		const workflowSteps =
			await this.workflowPolicyPort.getApprovalSteps(instance.documentId);

		const nextStep = this.workflowEngine.getNextStep(
			workflowSteps,
			task.stepOrder
		);

		// if no next step, complete workflow
		if (!nextStep) {
			instance.complete();

			await this.workflowRepository.updateTask(task);
			await this.workflowRepository.updateInstance(instance);

			// await this.auditPort.log({
			// 	type: "WORKFLOW_COMPLETED",
			// 	actorId,
			// 	subjectId: instance.documentId
			// });

			return { message: "Workflow completed successfully" };
		}

		// 8B. Otherwise → create next step tasks

		// Fetch document context
		const doc = await this.workflowDocumentPort.getDocumentById(
			instance.documentId
		);

		// Resolve approvers
		const userIds = await this.approverResolver.resolve(
			doc,
			nextStep.role,
			nextStep.resolutionStrategy
		);

		if (!userIds || userIds.length === 0) {
			throw new ApplicationError(ApplicationErrorEnum.APPROVER_NOT_FOUND, {
				message: "No approvers found for next step"
			});
		}

		// Create tasks
		const newTasks = this.workflowEngine.createTasks(
			instance.id,
			nextStep,
			userIds
		);

		// advance workflow state
		instance.moveToStep(nextStep.stepOrder);

		// persist everything
		await this.workflowRepository.updateTask(task);
		await this.workflowRepository.updateInstance(instance);
		await this.workflowRepository.saveTasks(newTasks);

		// audit
		// await this.auditPort.log({
		// 	type: "WORKFLOW_STEP_COMPLETED",
		// 	actorId,
		// 	subjectId: instance.documentId,
		// 	payload: {
		// 		completedStep: task.stepOrder,
		// 		nextStep: nextStep.stepOrder,
		// 		assignedTo: userIds
		// 	}
		// });

		return {
			message: "Step completed. Workflow advanced.",
			nextStep: nextStep.stepOrder
		};
	}
}

export default ApproveTaskUseCase;