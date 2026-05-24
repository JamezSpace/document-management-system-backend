import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import PostgresTransactionManager from "../shared/infrastructure/persistence/primary/PostgresTransactionManager.js";
import RecipientResolverService from "./application/services/RecipientResolver.service.js";
import SendCorrespondenceUseCase from "./application/usecases/SendCorrespondence.usecase.js";
import PostgresDispatchRecordRepoAdapter from "./infrastructure/persistence/PostgresDispatchRecordRepo.adapter.js";
import PostgresInboxEntryRepoAdapter from "./infrastructure/persistence/PostgresInboxEntryRepo.adapter.js";
import PostgresDispatchDocumentAdapter from "../documents/infrastructure/persistence/PostgresDispatchDocumentRepo.adapter.js";
import PostgresDispatchStaffAdapter from "../i & a/identity/infrastructure/persistence/entities/staff/PostgresDispatchStaffRepo.adapter.js";
import DispatchStarterAdapter from "./infrastructure/events/DispatchStarter.adapter.js";
import registerAllDispatchSubscribers from "./bootstrap/registerDispatchSubscribers.js";
import DispatchEventsAdapter from "./infrastructure/events/DispatchEvents.adapter.js";

interface DispatchSubsystemDependencies {
	globalEventBus: EventBusPort;
}

export default async function DispatchSubsystem(
	fastify: FastifyInstance,
	dependencies: DispatchSubsystemDependencies,
) {
	// dependencies
	const { globalEventBus } = dependencies;

	// infrastructure layer
	const postgres = fastify.pg;
	const idGenerator = new UuidV7Generator();
	const transactionManager = new PostgresTransactionManager(postgres);

	const dispatchRecordRepository = new PostgresDispatchRecordRepoAdapter(
		postgres,
	);
	const inboxEntryRepository = new PostgresInboxEntryRepoAdapter(postgres);
	const dispatchDocumentRepository = new PostgresDispatchDocumentAdapter(
		postgres,
	);
	const dispatchStaffRepository = new PostgresDispatchStaffAdapter(postgres);

    // events adapter
    const dispatchEventsAdapter = new DispatchEventsAdapter(globalEventBus);

	// services
	const recipientResolver = new RecipientResolverService(
		dispatchDocumentRepository,
		dispatchStaffRepository,
	);

	// use cases
	const sendCorrespondenceUseCase = new SendCorrespondenceUseCase(
		idGenerator,
		dispatchDocumentRepository,
		dispatchRecordRepository,
		dispatchStaffRepository,
		inboxEntryRepository,
		recipientResolver,
        dispatchEventsAdapter,
		transactionManager,
	);

	const dispatchStarterAdapter = new DispatchStarterAdapter(
		sendCorrespondenceUseCase,
	);

    // listener for document subsystem event emission
	registerAllDispatchSubscribers(globalEventBus, dispatchStarterAdapter);
}
