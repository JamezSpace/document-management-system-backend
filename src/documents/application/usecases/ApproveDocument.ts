import Document from "../../domain/Document.js";
import type { DocumentDecisionRepositoryPort } from "../ports/DocumentDecisionRepository.port.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";
import { DocumentAction } from "../types/DocumentDecisionAction.js";

class DocumentApproval {
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

    async approveDocument(documentDecision: {document: Document, approverId: string}) {
        documentDecision.document.approve()

        // persist state to database
        await this.documentRepo.save(documentDecision.document)

        // persist decision record as well
        await this.decisionRepo.save({
            documentId: documentDecision.document.id,
            action: DocumentAction.APPROVED,
            actorId: documentDecision.approverId,
            timestamp: new Date(),
            reason: null
        });

        // emit document approved event
        await this.documentEvents.documentApproved({
            documentId: documentDecision.document.id,
            approvedBy: documentDecision.approverId,
            timestamp: new Date()
        })
    }
}

export default DocumentApproval;