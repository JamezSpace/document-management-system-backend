import type { DocumentSchemaType } from "../../../api/types/document.type.js";
import Document from "../../../domain/Document.js";
import type { DocumentEventsPort } from "../../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/DocumentRepository.port.js";

class DocumentCreation {
	constructor(
		private readonly documentRepo: DocumentRepositoryPort,
        private readonly documentEvents: DocumentEventsPort
	) {}

    async createDocument(documentPayload: DocumentSchemaType) {
        // instantiate new document
        const newDocument = new Document(documentPayload);

        // create document
        newDocument.create()

        // persist state in database
        const verifiedNewDocument = await this.documentRepo.save(newDocument)

        // emit document created event
        await this.documentEvents.documentCreated({
            createdBy: verifiedNewDocument.ownerId,
            documentId: verifiedNewDocument.id,
            // metadata: document.metadata,
        })

        return verifiedNewDocument;
    }
}

export default DocumentCreation;
