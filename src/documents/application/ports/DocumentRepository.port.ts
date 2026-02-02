import type Document from "../../domain/Document.js";

interface DocumentRepositoryPort {
    save(document: Document): Promise<Document>;

    findDocumentById(id: string): Promise<Document | null>;

    editDocument(document: Document): Promise<Document | null>;

    softDeleteDocument(id: string): Promise<void>;

    hardDeleteDocument(id: string): Promise<void>;
}

export type { DocumentRepositoryPort };