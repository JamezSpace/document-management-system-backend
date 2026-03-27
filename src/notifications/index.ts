import type { FastifyInstance } from "fastify"
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js"
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import PostgresNotificationRepoAdapter from "./infrastructre/repos/PostgresNotificationRepo.adapter.js";
import registerAllDocumentSubscribers from "./bootstrap/documents/registerAllDocumentSubscribers.bootstrap.js";

interface NotificationSubsystemDependencies {
    globalEventBus: EventBusPort
}

export default async function NotificationSubsystem(fastify: FastifyInstance, dependencies: NotificationSubsystemDependencies) {
    // dependencies
    const { globalEventBus } = dependencies;

    const postgres = fastify.pg;
    const idGenerator = new UuidV7Generator();

    const notificationRepository = new PostgresNotificationRepoAdapter(postgres);

    registerAllDocumentSubscribers(postgres, globalEventBus);
}