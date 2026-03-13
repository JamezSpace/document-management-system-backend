import BusinessFunctionCreatedHandler from "../../application/handlers/documents/BussFunctionCreated.handler.js";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../shared/application/port/eventbus.port.js";
import CreateNotificationUseCase from "../../application/usecase/CreateNotification.usecase.js";
import PostgresNotificationRepoAdapter from "../../infrastructre/repos/PostgresNotificationRepo.adapter.js";
import type { PostgresDb } from "@fastify/postgres";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";

export default function registerAllDocumentSubscribers(dbPool: PostgresDb, bus: EventBus) {
    const notificationRepoAdapter = new PostgresNotificationRepoAdapter(dbPool);
    const idGenerator = new UuidV7Generator();

    const createNotificationUseCase = new CreateNotificationUseCase(notificationRepoAdapter, idGenerator);

    const businessFunctionHandler = new BusinessFunctionCreatedHandler(createNotificationUseCase)


    bus.subscribe(
        GlobalEventTypes.document.business_function.BUSS_FUNCTION_CREATED,
        businessFunctionHandler.handle
    )
}