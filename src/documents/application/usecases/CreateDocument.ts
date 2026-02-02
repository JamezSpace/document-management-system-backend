import type Document from "../../domain/Document.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";

class DocumentCreation {
	private readonly documentRepo: DocumentRepositoryPort;
	private readonly documentEvents: DocumentEventsPort;

	constructor(
		documentRepoInstance: DocumentRepositoryPort,
		documentEventInstance: DocumentEventsPort,
	) {
		this.documentEvents = documentEventInstance;
		this.documentRepo = documentRepoInstance;
	}

    async createDocument(document: Document) {
        document.create()

        // persist state in database
        await this.documentRepo.save(document)

        // emit document created event
        await this.documentEvents.documentCreated({
            createdBy: document.ownerId,
            documentId: document.id,
            metadata: document.metadata,
            timestamp: new Date()
        })
    }
}

export default DocumentCreation;
