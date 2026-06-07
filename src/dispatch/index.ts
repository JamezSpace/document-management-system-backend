import type { FastifyInstance } from "fastify";
import DispatchDocumentAdapter from "../documents/infrastructure/persistence/DispatchDocumentRepository.adapter.js";
import DispatchStaffAdapter from "../i & a/identity/infrastructure/persistence/entities/staff/DispatchStaffRepo.adapter.js";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import RecipientResolverService from "./application/services/RecipientResolver.service.js";
import SendCorrespondenceUseCase from "./application/usecases/SendCorrespondence.usecase.js";
import registerAllDispatchSubscribers from "./bootstrap/registerDispatchSubscribers.js";
import DispatchEventsAdapter from "./infrastructure/events/DispatchEvents.adapter.js";
import DispatchStarterAdapter from "./infrastructure/events/DispatchStarter.adapter.js";
import DispatchRecordRepoAdapter from "./infrastructure/persistence/DispatchRecordRepo.adapter.js";
import InboxEntryRepoAdapter from "./infrastructure/persistence/InboxEntryRepo.adapter.js";

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
	const transactionManager = new TransactionManager(postgres);

	const dispatchRecordRepository = new DispatchRecordRepoAdapter(
		postgres,
	);
	const inboxEntryRepository = new InboxEntryRepoAdapter(postgres);
	const dispatchDocumentRepository = new DispatchDocumentAdapter(postgres);
	const dispatchStaffRepository = new DispatchStaffAdapter(postgres);

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
