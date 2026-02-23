import type { DocumentRepositoryPort } from "../../application/ports/DocumentRepository.port.js";
import type Document from "../../domain/Document.js";

class PostgresqlDocumentRepositoryAdapter implements DocumentRepositoryPort {
    save(document: Document): Promise<Document> {
        throw new Error("Method not implemented.");
    }

    findDocumentById(id: string): Promise<Document | null> {
        throw new Error("Method not implemented.");
    }

    editDocument(document: Document): Promise<Document | null> {
        throw new Error("Method not implemented.");
    }

    softDeleteDocument(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    hardDeleteDocument(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}

export default PostgresqlDocumentRepositoryAdapter;