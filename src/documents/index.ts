import type { FastifyInstance } from "fastify";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import DocumentController from "./api/controllers/DocumentController.js";
import documentRoutes from "./api/routes/documents.route.js";
import DocumentCreation from "./application/usecases/documents/CreateDocument.usecase.js";
import DocumentEventsAdapter from "./infrastructure/adapters/DocumentEvents.adapter.js";
import PostgresqlDocumentRepositoryAdapter from "./infrastructure/persistence/PostgresDocumentRepo.adapter.js";

export default async function DocumentSubsystem(fastify: FastifyInstance) {
    // infastructure layer
    const globalEventBus = new InMemoryEventBusAdapter();
	const documentRepository = new PostgresqlDocumentRepositoryAdapter();
	const documentEventsAdapter = new DocumentEventsAdapter(globalEventBus);

    // application layer
    const createNewDocumentUseCase = new DocumentCreation(
        documentRepository,
        documentEventsAdapter
    );

    // controller Layer
    const documentController = new DocumentController(createNewDocumentUseCase)

    await fastify.register(documentRoutes, {
        controller: documentController,
    })
}