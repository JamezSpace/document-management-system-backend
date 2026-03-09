import type DocumentVersion from "../../../domain/DocumentVersion.js";

interface DocumentVersionRepositoryPort {
    save(document: DocumentVersion): Promise<DocumentVersion>;

    findVersionedDocumentById(id: string): Promise<DocumentVersion | null>;

    editVersionedDocument(document: DocumentVersion): Promise<DocumentVersion | null>;

    softDeleteDocument(id: string): Promise<void>;

    hardDeleteDocument(id: string): Promise<void>;
}

export type { DocumentVersionRepositoryPort };
