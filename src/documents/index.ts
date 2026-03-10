import type { FastifyInstance } from "fastify";
import MediaServiceAdapter from "../shared/infrastructure/adapters/MediaService.adapter.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import CorrespondenceSubjectController from "./api/controllers/correspondenceSubject/CorrespondenceSubjectController.js";
import DocumentController from "./api/controllers/document/DocumentController.js";
import correspondenceSubjectRoutes from "./api/routes/corrSubject.route.js";
import documentRoutes from "./api/routes/documents.route.js";
import CreateCorrespondenceSubjectUseCase from "./application/usecases/correspondenceSubject/CreateCorrespondenceSubject.usecase.js";
import DocumentCreation from "./application/usecases/document/CreateDocument.usecase.js";
import CorrespondenceSubjectEventsAdapter from "./infrastructure/adapters/CorrSubjectEvents.adapter.js";
import DocumentEventsAdapter from "./infrastructure/adapters/DocumentEvents.adapter.js";
import PostgresCorrespondenceSubjectRepoAdapter from "./infrastructure/persistence/PostgresCorrSubjectRepo.adapter.js";
import PostgresqlDocumentRepositoryAdapter from "./infrastructure/persistence/PostgresDocumentRepo.adapter.js";
import PostgresDocVersionRepositoryAdapter from "./infrastructure/persistence/PostgresDocVersionRepo.adapter.js";
import PostgresReferenceSequenceRepositoryAdapter from "./infrastructure/persistence/PostgresReferenceSequenceRepo.adapter.js";
import ReferenceNumberService from "./infrastructure/services/ReferenceNumberService.adapter.js";
import RetentionService from "./infrastructure/services/RetentionService.js";
import type { RetentionServicePort } from "./application/ports/services/RetentionService.port.js";


interface DocumentSubsystemDependencies {
    retentionService: RetentionServicePort;
}

export default async function DocumentSubsystem(fastify: FastifyInstance, dependencies: DocumentSubsystemDependencies) {

    // dependencies
    const { retentionService } = dependencies;

	// infrastructure Layer
	const postgres = fastify.pg;

	const globalEventBus = new InMemoryEventBusAdapter();
    const idGenerator = new UuidV7Generator();
    
    // all module repos in documents subsystem
	const documentRepository = new PostgresqlDocumentRepositoryAdapter(postgres);
    const docVersionRepository = new PostgresDocVersionRepositoryAdapter(postgres);
	const corrSubjectRepository = new PostgresCorrespondenceSubjectRepoAdapter(postgres);
    const refSequenceRepository = new PostgresReferenceSequenceRepositoryAdapter(postgres);


    //  all module event adapters in documents subsystem
	const documentEventsAdapter = new DocumentEventsAdapter(globalEventBus);
	const corrSubjectEventsAdapter = new CorrespondenceSubjectEventsAdapter(globalEventBus);

    // service
    const refNumberService = new ReferenceNumberService(refSequenceRepository);
    const mediaService = new MediaServiceAdapter();

	// application layer - documents
	const createNewDocumentUseCase = new DocumentCreation(
        idGenerator,
        documentRepository,
        docVersionRepository,
		documentEventsAdapter,
        refNumberService,
        mediaService,
        retentionService
	);
    
    // application layer - correspondence subjects
    const createCorrSubjectUsecase = new CreateCorrespondenceSubjectUseCase(
        idGenerator,
        corrSubjectEventsAdapter,
        corrSubjectRepository
    )

	// controller Layer
	const documentController = new DocumentController(createNewDocumentUseCase);

	const corrSubjectController = new CorrespondenceSubjectController(createCorrSubjectUsecase);

	await fastify.register(documentRoutes, {
		controller: documentController,
	});

	await fastify.register(correspondenceSubjectRoutes, {
		controller: corrSubjectController,
	});
}
