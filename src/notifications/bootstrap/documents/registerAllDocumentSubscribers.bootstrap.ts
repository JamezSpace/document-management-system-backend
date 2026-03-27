import type { PostgresDb } from "@fastify/postgres";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import BusinessFunctionCreatedHandler from "../../application/handlers/documents/BussFunctionCreated.handler.js";
import CreateNotificationUseCase from "../../application/usecase/CreateNotification.usecase.js";
import PostgresNotificationRepoAdapter from "../../infrastructre/repos/PostgresNotificationRepo.adapter.js";

export default function registerAllDocumentSubscribers(dbPool: PostgresDb, bus: EventBusPort) {
    const notificationRepoAdapter = new PostgresNotificationRepoAdapter(dbPool);
    const idGenerator = new UuidV7Generator();

    const createNotificationUseCase = new CreateNotificationUseCase(notificationRepoAdapter, idGenerator);

    const businessFunctionHandler = new BusinessFunctionCreatedHandler(createNotificationUseCase)


    bus.subscribe(
        GlobalEventTypes.document.business_function.BUSS_FUNCTION_CREATED,
        event => businessFunctionHandler.handle(event)
    )
}