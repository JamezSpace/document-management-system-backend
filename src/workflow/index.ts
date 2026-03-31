import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import type { WorkflowAccessPort } from "../shared/application/port/WorkflowAccessPort.js";
import type { WorkflowDocumentPort } from "../shared/application/port/WorkflowDocumentPort.js";
import type { WorkflowPolicyPort } from "../shared/application/port/WorkflowPolicy.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import StartWorkflowUseCase from "./application/usecases/StartWorkflow.usecase.js";
import registerAllWorkflowSubscribers from "./bootstrap/registerDocumentSubscribers.js";
import WorkflowEngine from "./domain/WorkflowEngine.service.js";
import WorkflowStarterAdapter from "./infrastructure/adapters/WorkflowStarterAdapter.adapter.js";
import PostgresWorkflowRepository from "./infrastructure/persistence/PostgresWorkflowRepository.adapter.js";
import ApproverResolverServiceAdapter from "./infrastructure/services/ApproverResolverService.adapter.js";
import WorkflowEventsAdapter from "./infrastructure/adapters/events/WorkflowEventsAdapter.js";


interface WorkflowSubsystemDependencies {
    documentWorkflowAdapter: WorkflowDocumentPort;
    policyWorkflowAdapter: WorkflowPolicyPort;
    accessWorkflowAdapter: WorkflowAccessPort;
    globalEventBus: EventBusPort
}

export default async function WorkflowSubsystem(fastify: FastifyInstance, dependencies: WorkflowSubsystemDependencies) {
    // dependencies
    const { documentWorkflowAdapter, policyWorkflowAdapter, accessWorkflowAdapter, globalEventBus } = dependencies;

    const postgres = fastify.pg;
    const idGenerator = new UuidV7Generator();

    // adapter - events
    const workflowEventsAdapter = new WorkflowEventsAdapter(globalEventBus);

    // adapter - persistence
    const workflowRepository = new PostgresWorkflowRepository(postgres);

    // use cases
    const workflowEngine = new WorkflowEngine(idGenerator);
    const approverResolver = new ApproverResolverServiceAdapter(accessWorkflowAdapter);

    const startWorkflowUseCase = new StartWorkflowUseCase(idGenerator, documentWorkflowAdapter, policyWorkflowAdapter, workflowEngine, approverResolver, workflowRepository, workflowEventsAdapter)

    const workflowStarterAdapter = new WorkflowStarterAdapter(startWorkflowUseCase);

    registerAllWorkflowSubscribers(globalEventBus, workflowStarterAdapter);
}