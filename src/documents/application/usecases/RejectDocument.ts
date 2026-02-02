import Document from "../../domain/Document.js";
import type { DocumentDecisionRepositoryPort } from "../ports/DocumentDecisionRepository.port.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";
import { DocumentAction } from "../types/DocumentDecisionAction.js";

class DocumentRejection {
        private readonly documentRepo: DocumentRepositoryPort;
        private readonly decisionRepo: DocumentDecisionRepositoryPort;
        private readonly documentEvents: DocumentEventsPort;
    
        constructor(
        documentRepoInstance: DocumentRepositoryPort,
        decisionRepoInstance: DocumentDecisionRepositoryPort,
        documentEventsInstance: DocumentEventsPort,
    ) {
        this.documentRepo = documentRepoInstance;
        this.decisionRepo = decisionRepoInstance;
        this.documentEvents = documentEventsInstance;
    }

    async rejectDocument(documentDecision: {
        document: Document;
        rejectorId: string;
        reason: string;
    }) {
        // 1. Domain transition
        documentDecision.document.reject();

        // persist state to database
        await this.documentRepo.save(documentDecision.document);

        // persist decision record as well
        await this.decisionRepo.save({
            documentId: documentDecision.document.id,
            action: DocumentAction.REJECTED,
            actorId: documentDecision.rejectorId,
            reason: documentDecision.reason,
            timestamp: new Date(),
        });

        // 4. Emit event
        await this.documentEvents.documentRejected({
            documentId: documentDecision.document.id,
            rejectedBy: documentDecision.rejectorId,
            reason: documentDecision.reason,
            timestamp: new Date(),
        });
    }
}
