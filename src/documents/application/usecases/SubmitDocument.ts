import type Document from "../../domain/Document.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";

class DocumentSubmission {
    private readonly documentRepo: DocumentRepositoryPort;
	private readonly documentEvents: DocumentEventsPort;

	constructor(
		documentRepoInstance: DocumentRepositoryPort,
		documentEventInstance: DocumentEventsPort,
	) {
		this.documentEvents = documentEventInstance;
		this.documentRepo = documentRepoInstance;
	}

    async submitDocument(document: Document) {
        // this only changes the state within the domain not the database
        document.submit()

        // this persists the changed document state to database
        await this.documentRepo.save(document);

        // emit document submitted event
        await this.documentEvents.documentSubmitted({
            documentId: document.id,
            submittedBy: document.ownerId,
            // TAKE NOTE: submittedBy insists the only person that can submit the document is the owner of the document. That is, given the instance of editing a document and this use case is going to be used to submit the edit, the system would lose record of who actually editted coz submittedBy is working with ownerId (the person that created the document)
            
            // TODO: carefully factor in document editing process. Questions to consider
            // 1. Can anyone with a higher authority edit a document created by a person of lower authority or it is he who creates that can be the only one that edits??
            timestamp: new Date()
        })
    }
}

export default DocumentSubmission;