import type Document from "../../../domain/entities/document/Document.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import { DocumentAction } from "../../types/documentDecisionAction.type.js";
import type { DocumentDecisionRepositoryPort } from "../ports/DocumentDecisionRepository.port.js";

class DocumentArchival {
    private readonly documentRepo: DocumentRepositoryPort;
    private readonly decisionRepo: DocumentDecisionRepositoryPort;
	private readonly documentEvents: DocumentEventsPort;

	constructor(
		documentRepoInstance: DocumentRepositoryPort,
        decisionRepoInstance: DocumentDecisionRepositoryPort,
		documentEventInstance: DocumentEventsPort,
	) {
		this.decisionRepo = decisionRepoInstance;
        this.documentEvents = documentEventInstance;
		this.documentRepo = documentRepoInstance;
	}

    async archiveDocument(documentDecision: {document: Document, archiverId: string}) {
        documentDecision.document.approve()

        // persist state to database
        await this.documentRepo.save(documentDecision.document)

        // persist decision record as well
        await this.decisionRepo.save({
            documentId: documentDecision.document.id,
            action: DocumentAction.ARCHIVED,
            actorId: documentDecision.archiverId,
            timestamp: new Date(),
            reason: null
        });

        // emit document approved event
        await this.documentEvents.documentArchived({
            documentId: documentDecision.document.id,
            archivedBy: documentDecision.archiverId,
            timestamp: new Date()
        })
    }
}

export default DocumentArchival;