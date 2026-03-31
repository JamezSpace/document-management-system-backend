import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import MediaServiceAdapter from "../shared/infrastructure/adapters/services/media/MediaService.adapter.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import BusinessFunctionController from "./api/controllers/businessFunction/BusinessFunctionController.js";
import CorrespondenceSubjectController from "./api/controllers/correspondenceSubject/CorrespondenceSubjectController.js";
import DocumentController from "./api/controllers/document/DocumentController.js";
import DocumentTypeController from "./api/controllers/documentType/DocumentTypeController.js";
import businessFunctionRoutes from "./api/routes/bussFunction.route.js";
import correspondenceSubjectRoutes from "./api/routes/corrSubject.route.js";
import documentTypeRoutes from "./api/routes/docType.route.js";
import documentRoutes from "./api/routes/documents.route.js";
import type { RetentionServicePort } from "./application/ports/services/RetentionService.port.js";
import CreateBusinessFunctionUseCase from "./application/usecases/businessFunction/CreateBusinessFunction.usecase.js";
import GetAllBusinessFunctionsUseCase from "./application/usecases/businessFunction/GetAllBusinessFunctions.usecase.js";
import CreateCorrespondenceSubjectUseCase from "./application/usecases/correspondenceSubject/CreateCorrespondenceSubject.usecase.js";
import GetAllCorrespondenceSubjectUseCase from "./application/usecases/correspondenceSubject/GetAllCorrespondenceSubject.usecase.js";
import DocumentCreation from "./application/usecases/document/CreateDocument.usecase.js";
import DeleteDocumentUseCase from "./application/usecases/document/DeleteDocument.usecase.js";
import GetAllDocumentsByStaffUseCase from "./application/usecases/document/GetAllDocumentsByStaff.usecase.js";
import GetDocumentByIdUsecase from "./application/usecases/document/GetDocById.usecase.js";
import DocumentSubmission from "./application/usecases/document/SubmitDocument.usecase.js";
import CreateDocumentTypeUsecase from "./application/usecases/documentType/CreateDocType.usecase.js";
import GetAllDocumentTypesUsecase from "./application/usecases/documentType/GetAllDocTypes.usecase.js";
import GetDocumentTypeByIdUsecase from "./application/usecases/documentType/GetDocTypeById.usecase.js";
import BusinessFunctionEventsAdapter from "./infrastructure/adapters/BussFunctionEvents.adapter.js";
import CorrespondenceSubjectEventsAdapter from "./infrastructure/adapters/CorrSubjectEvents.adapter.js";
import DocumentEventsAdapter from "./infrastructure/adapters/DocumentEvents.adapter.js";
import DocumentTypeEventsAdapter from "./infrastructure/adapters/DocumentTypeEvents.adapter.js";
import PostgresBusinessFunctionRepoAdapter from "./infrastructure/persistence/PostgresBussFunctionRepository.adapter.js";
import PostgresCorrespondenceSubjectRepoAdapter from "./infrastructure/persistence/PostgresCorrSubjectRepo.adapter.js";
import PostgresDocTypeRepoAdapter from "./infrastructure/persistence/PostgresDocTypeRepo.adapter.js";
import PostgresqlDocumentRepositoryAdapter from "./infrastructure/persistence/PostgresDocumentRepo.adapter.js";
import PostgresDocVersionRepositoryAdapter from "./infrastructure/persistence/PostgresDocVersionRepo.adapter.js";
import PostgresLifecycleHistoryRepositoryAdapter from "./infrastructure/persistence/PostgresLifecycleHistoryRepository.adapter.js";
import PostgresReferenceSequenceRepositoryAdapter from "./infrastructure/persistence/PostgresReferenceSequenceRepo.adapter.js";
import ReferenceNumberService from "./infrastructure/services/ReferenceNumberService.adapter.js";

interface DocumentSubsystemDependencies {
	retentionService: RetentionServicePort;
    globalEventBus: EventBusPort
}

export default async function DocumentSubsystem(
	fastify: FastifyInstance,
	dependencies: DocumentSubsystemDependencies,
) {
	// dependencies
	const { retentionService, globalEventBus } = dependencies;

	// infrastructure Layer
	const postgres = fastify.pg;

	const idGenerator = new UuidV7Generator();

	// all module repos in documents subsystem
	const documentRepository = new PostgresqlDocumentRepositoryAdapter(
		postgres,
	);
	const docVersionRepository = new PostgresDocVersionRepositoryAdapter(
		postgres,
	);
	const lifecycleHistoryRepository = new PostgresLifecycleHistoryRepositoryAdapter(
		postgres,
	);
	const corrSubjectRepository = new PostgresCorrespondenceSubjectRepoAdapter(
		postgres,
	);
	const bussFunctionRepository = new PostgresBusinessFunctionRepoAdapter(
		postgres,
	);
	const docTypeRepository = new PostgresDocTypeRepoAdapter(postgres);

	const refSequenceRepository =
		new PostgresReferenceSequenceRepositoryAdapter(postgres);

	//  all module event adapters in documents subsystem
	const documentEventsAdapter = new DocumentEventsAdapter(globalEventBus);
	const corrSubjectEventsAdapter = new CorrespondenceSubjectEventsAdapter(
		globalEventBus,
	);
	const bussFunctionEventsAdapter = new BusinessFunctionEventsAdapter(
		globalEventBus,
	);
	const docTypeEventsAdapter = new DocumentTypeEventsAdapter(globalEventBus);

	// service
	const refNumberService = new ReferenceNumberService(refSequenceRepository);
	const mediaService = new MediaServiceAdapter();

	// application layer - documents
	const createNewDocumentUseCase = new DocumentCreation(
		idGenerator,
		documentRepository,
		docVersionRepository,
        lifecycleHistoryRepository,
		docTypeRepository,
		documentEventsAdapter,
		refNumberService,
		mediaService,
		retentionService,
	);

	const getAllDocumentsUseCase = new GetAllDocumentsByStaffUseCase(
		documentRepository,
	);

	const getDocumentByIdUseCase = new GetDocumentByIdUsecase(
		documentRepository,
	);

	const submitDocumentUseCase = new DocumentSubmission(
        idGenerator,
		documentRepository,
        docVersionRepository,
        lifecycleHistoryRepository,
		documentEventsAdapter,
	);

	const deleteDocumentUseCase = new DeleteDocumentUseCase(
        idGenerator,
		documentRepository,
        lifecycleHistoryRepository,
		documentEventsAdapter,
	);

	// application layer - correspondence subjects
	const createCorrSubjectUsecase = new CreateCorrespondenceSubjectUseCase(
		corrSubjectEventsAdapter,
		corrSubjectRepository,
	);

	const getAllCorrespondenceSubjectUseCase =
		new GetAllCorrespondenceSubjectUseCase(corrSubjectRepository);

	// application layer - business functions
	const getAllBusinessFunctionUseCase = new GetAllBusinessFunctionsUseCase(
		bussFunctionRepository,
	);

	const createBusinessFunctionUseCase = new CreateBusinessFunctionUseCase(
		bussFunctionEventsAdapter,
		bussFunctionRepository,
	);

	// application layer - document types
	const createDocumentTypeUseCase = new CreateDocumentTypeUsecase(
		idGenerator,
		docTypeRepository,
		docTypeEventsAdapter,
	);

	const getAllDocumentTypeUseCase = new GetAllDocumentTypesUsecase(
		docTypeRepository,
	);

	const getDocumentTypeByIdUseCase = new GetDocumentTypeByIdUsecase(
		docTypeRepository,
	);

	// controller Layer
	const documentController = new DocumentController(
		createNewDocumentUseCase,
		getAllDocumentsUseCase,
        getDocumentByIdUseCase,
		submitDocumentUseCase,
		deleteDocumentUseCase,
	);

	const corrSubjectController = new CorrespondenceSubjectController(
		createCorrSubjectUsecase,
		getAllCorrespondenceSubjectUseCase,
	);

	const bussFunctionController = new BusinessFunctionController(
		createBusinessFunctionUseCase,
		getAllBusinessFunctionUseCase,
	);

	const documentTypeController = new DocumentTypeController(
		createDocumentTypeUseCase,
		getAllDocumentTypeUseCase,
        getDocumentTypeByIdUseCase
	);

	await fastify.register(documentRoutes, {
		controller: documentController,
	});

	await fastify.register(correspondenceSubjectRoutes, {
		controller: corrSubjectController,
	});

	await fastify.register(businessFunctionRoutes, {
		controller: bussFunctionController,
	});

	await fastify.register(documentTypeRoutes, {
		controller: documentTypeController,
	});
}
