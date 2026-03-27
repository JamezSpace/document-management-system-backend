import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { WorkflowRepositoryPort } from "../../application/port/repos/WorkflowRepository.port.js";
import { WorkflowTaskStatus } from "../../domain/enum/WorkflowTaskStatus.enum.js";
import type WorkflowInstance from "../../domain/entities/WorkflowInstance.js";
import type WorkflowTask from "../../domain/entities/WorkflowTask.js";
import WorkflowInstanceEntity from "../../domain/entities/WorkflowInstance.js";
import WorkflowTaskEntity from "../../domain/entities/WorkflowTask.js";

class PostgresWorkflowRepository implements WorkflowRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

	private mapInstance(row: any): WorkflowInstance {
		return new WorkflowInstanceEntity({
			id: row.id,
			documentId: row.document_id,
			currentStep: row.current_step,
			status: row.status,
			createdAt: row.created_at,
		});
	}

	private mapTask(row: any): WorkflowTask {
		return new WorkflowTaskEntity({
			id: row.id,
			workflowInstanceId: row.workflow_instance_id,
			stepOrder: row.step_order,
			assignedTo: row.assigned_to,
			role: row.role,
			status: row.status,
			createdAt: row.created_at,
		});
	}

    async saveInstance(instance: WorkflowInstance): Promise<void> {
		try {
			const query = `
				INSERT INTO workflow.workflow_instances (
					id, document_id, current_step, status, created_at
				) VALUES ($1, $2, $3, $4, $5);
			`;

			await this.dbPool.query(query, [
				instance.id,
				instance.documentId,
				instance.currentStep,
				instance.status,
				instance.createdAt ?? new Date(),
			]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
    }

    async getInstanceById(instanceId: string): Promise<WorkflowInstance | null> {
		try {
			const query = "SELECT * FROM workflow.workflow_instances WHERE id = $1 LIMIT 1;";
			const result = await this.dbPool.query(query, [instanceId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.mapInstance(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
    }

    async getInstanceByDocumentId(documentId: string): Promise<WorkflowInstance | null> {
		try {
			const query = `
				SELECT * FROM workflow.workflow_instances
				WHERE document_id = $1
				ORDER BY created_at DESC
				LIMIT 1;
			`;
			const result = await this.dbPool.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.mapInstance(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
    }

    async updateInstance(instance: WorkflowInstance): Promise<void> {
		try {
			const query = `
				UPDATE workflow.workflow_instances
				SET current_step = $2,
					status = $3,
					updated_at = NOW()
				WHERE id = $1;
			`;

			await this.dbPool.query(query, [
				instance.id,
				instance.currentStep,
				instance.status,
			]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
    }

    async saveTasks(tasks: WorkflowTask[]): Promise<void> {
		if (tasks.length === 0) return;

		try {
			const query = `
				INSERT INTO workflow.workflow_tasks (
					id, workflow_instance_id, step_order, assigned_to, role, status, created_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7);
			`;

			for (const task of tasks) {
				await this.dbPool.query(query, [
					task.id,
					task.workflowInstanceId,
					task.stepOrder,
					task.assignedTo,
					task.role,
					task.getStatus(),
					task.createdAt ?? new Date(),
				]);
			}
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
    }

    async getTasksByInstanceId(instanceId: string): Promise<WorkflowTask[]> {
		try {
			const query = `
				SELECT * FROM workflow.workflow_tasks
				WHERE workflow_instance_id = $1
				ORDER BY step_order ASC;
			`;
			const result = await this.dbPool.query(query, [instanceId]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.mapTask(row));
		} catch (error: any) {
			throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
    }

    async getTasksByStep(instanceId: string, stepOrder: number): Promise<WorkflowTask[]> {
		try {
			const query = `
				SELECT * FROM workflow.workflow_tasks
				WHERE workflow_instance_id = $1 AND step_order = $2
				ORDER BY created_at ASC;
			`;
			const result = await this.dbPool.query(query, [instanceId, stepOrder]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.mapTask(row));
		} catch (error: any) {
			throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
    }

    async getTaskById(taskId: string): Promise<WorkflowTask | null> {
		try {
			const query = "SELECT * FROM workflow.workflow_tasks WHERE id = $1 LIMIT 1;";
			const result = await this.dbPool.query(query, [taskId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.mapTask(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
    }

    async updateTask(task: WorkflowTask): Promise<void> {
		try {
			const actedAt =
				task.getStatus() === WorkflowTaskStatus.PENDING
					? null
					: new Date();

			const query = `
				UPDATE workflow.workflow_tasks
				SET status = $2,
					acted_at = $3
				WHERE id = $1;
			`;

			await this.dbPool.query(query, [
				task.id,
				task.getStatus(),
				actedAt,
			]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
    }

    
}

export default PostgresWorkflowRepository;
