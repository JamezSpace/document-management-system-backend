import type WorkflowInstance from "../../../domain/entities/WorkflowInstance.js";
import type WorkflowTask from "../../../domain/entities/WorkflowTask.js";

interface WorkflowRepositoryPort {
	saveInstance(instance: WorkflowInstance): Promise<void>;

	getInstanceById(
		instanceId: string,
	): Promise<WorkflowInstance | null>;

	getInstanceByDocumentId(
		documentId: string,
	): Promise<WorkflowInstance | null>;

	updateInstance(instance: WorkflowInstance): Promise<void>;

	saveTasks(tasks: WorkflowTask[]): Promise<void>;

	getTasksByInstanceId(instanceId: string): Promise<WorkflowTask[]>;

	getTasksByStep(
		instanceId: string,
		stepOrder: number,
	): Promise<WorkflowTask[]>;

	getTaskById(taskId: string): Promise<WorkflowTask | null>;

	updateTask(task: WorkflowTask): Promise<void>;
}

export type { WorkflowRepositoryPort };
