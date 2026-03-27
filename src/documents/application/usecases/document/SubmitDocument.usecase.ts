import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import Document from "../../../domain/entities/document/Document.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";


class DocumentSubmission {
	constructor(
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
	private readonly documentEvents: DocumentEventsPort
	) {}

    async submitDocument(actorId: string, document: Document) {
        const versionedDocument = document.getCurrentVersion();

        // this affirms that documents that have been versioned can be submitted
        if(!versionedDocument)
            throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
                message: "Only versioned documents can be submitted"
            })

        const previousState = versionedDocument.getState()

        // this only changes the state within the domain not the database
        versionedDocument.submit(actorId)
                

        // this persists the changed document state to database
        const savedVersionedDoc = await this.documentVersionRepo.editVersionedDocument(versionedDocument);

        const submittedDocument = await this.documentRepo.editDocument(document);

        // emit document submitted event
        if(submittedDocument)
            await this.documentEvents.documentSubmitted({
                documentId: document.id,
                submittedBy: actorId,
                documentVersionId: versionedDocument.id,
                fromState: previousState,
                toState: LifecycleState.IN_REVIEW
            })
        
        return submittedDocument;
            // TODO: carefully factor in document editing process. Questions to consider
            // 1. Can anyone with a higher authority edit a document created by a person of lower authority or it is he who creates that can be the only one that edits??
    }
}

export default DocumentSubmission;