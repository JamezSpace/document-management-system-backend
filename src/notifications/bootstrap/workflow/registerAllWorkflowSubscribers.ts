import type { PostgresDb } from "@fastify/postgres";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import CreateNotificationUseCase from "../../application/usecase/CreateNotification.usecase.js";
import PostgresNotificationRepoAdapter from "../../infrastructre/repos/PostgresNotificationRepo.adapter.js";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import WorkflowTaskAssigned from "../../application/handlers/workflow/WorkflowTaskAssigned.handler.js";
import WorkflowTasksAssignedHandler from "../../application/handlers/workflow/WorkflowTaskAssigned.handler.js";

export default function registerAllWorkflowSubscribers(dbPool: PostgresDb, eventBus: EventBusPort) {
    const notificationRepoAdapter = new PostgresNotificationRepoAdapter(dbPool);
    const idGenerator = new UuidV7Generator();

    const createNotificationUseCase = new CreateNotificationUseCase(notificationRepoAdapter, idGenerator);
    
    const workflowTasksAssignedHandler = new WorkflowTasksAssignedHandler(createNotificationUseCase);

    eventBus.subscribe(
    GlobalEventTypes.workflow.WORKFLOW_TASKS_ASSIGNED,
    async event => workflowTasksAssignedHandler.handle(event)
);
}

