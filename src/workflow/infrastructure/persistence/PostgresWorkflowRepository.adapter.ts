import type { PostgresDb } from "@fastify/postgres";
import type { WorkflowRepositoryPort } from "../../application/port/repos/WorkflowRepository.port.js";
import type WorkflowInstance from "../../domain/entities/WorkflowInstance.js";
import type WorkflowTask from "../../domain/entities/WorkflowTask.js";

class PostgresWorkflowRepository implements WorkflowRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

    saveInstance(instance: WorkflowInstance): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getInstanceById(instanceId: string): Promise<WorkflowInstance | null> {
        throw new Error("Method not implemented.");
    }
    getInstanceByDocumentId(documentId: string): Promise<WorkflowInstance | null> {
        throw new Error("Method not implemented.");
    }
    updateInstance(instance: WorkflowInstance): Promise<void> {
        throw new Error("Method not implemented.");
    }
    saveTasks(tasks: WorkflowTask[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getTasksByInstanceId(instanceId: string): Promise<WorkflowTask[]> {
        throw new Error("Method not implemented.");
    }
    getTasksByStep(instanceId: string, stepOrder: number): Promise<WorkflowTask[]> {
        throw new Error("Method not implemented.");
    }
    getTaskById(taskId: string): Promise<WorkflowTask | null> {
        throw new Error("Method not implemented.");
    }
    updateTask(task: WorkflowTask): Promise<void> {
        throw new Error("Method not implemented.");
    }

    
}

export default PostgresWorkflowRepository;