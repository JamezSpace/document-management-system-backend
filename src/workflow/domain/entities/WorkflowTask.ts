import DomainError from "../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import { WorkflowTaskStatus } from "../enum/WorkflowTaskStatus.enum.js";

interface WorkflowTaskPayload {
	id: string;
	workflowInstanceId: string;
	stepOrder: number;
	assignedTo: string;
	role: string;
	status: WorkflowTaskStatus;
	createdAt?: Date;
}

class WorkflowTask {
	readonly id: string;
	readonly workflowInstanceId: string;
	readonly stepOrder: number;
	readonly assignedTo: string;
	readonly role: string;
	private status: WorkflowTaskStatus;
	readonly createdAt: Date;

	constructor(payload: WorkflowTaskPayload) {
		this.id = payload.id;
		this.workflowInstanceId = payload.workflowInstanceId;
		this.stepOrder = payload.stepOrder;
		this.assignedTo = payload.assignedTo;
		this.role = payload.role;
		this.status = payload.status;
		this.createdAt = payload.createdAt ?? new Date();
	}

	// state checks
	isPending(): boolean {
		return this.status === WorkflowTaskStatus.PENDING;
	}

	isApproved(): boolean {
		return this.status === WorkflowTaskStatus.APPROVED;
	}

	isRejected(): boolean {
		return this.status === WorkflowTaskStatus.REJECTED;
	}

	// helper function for auth check
	canBeActionedBy(actorId: string): boolean {
		return actorId === this.assignedTo;
	}

	// core domain actions
	approve(actorId: string) {
		this.ensureCanAct(actorId);
		this.ensurePending();

		this.status = WorkflowTaskStatus.APPROVED;
	}

	reject(actorId: string) {
		this.ensureCanAct(actorId);
		this.ensurePending();

		this.status = WorkflowTaskStatus.REJECTED;
	}

	// internal guards
	private ensureCanAct(actorId: string) {
		if (actorId !== this.assignedTo) {
			throw new DomainError(
				GlobalDomainErrors.workflow.UNAUTHORISED_APPROVAL,
				{
					details: {
						message:
							"Only the assigned user can act on this task.",
					},
				}
			);
		}
	}

	private ensurePending() {
		if (this.status !== WorkflowTaskStatus.PENDING) {
			throw new DomainError(
				GlobalDomainErrors.workflow.INVALID_OPERATION,
				{
					details: {
						message: "Task has already been processed.",
					},
				}
			);
		}
	}

	// exposing read-only status
	getStatus(): WorkflowTaskStatus {
		return this.status;
	}
}

export default WorkflowTask;