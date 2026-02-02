import DocumentDecision from "../../domain/DocumentDecision.js";

interface DocumentDecisionRepositoryPort {
    save(documentDecision: DocumentDecision): Promise<DocumentDecision>;

    findDocumentDecisionById(id: string): Promise<DocumentDecision | null>;

    findDocumentDecisoinByDocumentId(documentId: string): Promise<DocumentDecision[]>
}

export type { DocumentDecisionRepositoryPort };