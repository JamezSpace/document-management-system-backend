import DocumentType from "../../../domain/entities/documentType/DocumentType.js";

interface DocumentTypeRepositoryPort {
    save(type: DocumentType): Promise<DocumentType>;

    fetchAll(): Promise<DocumentType[]>;

    findDocumentTypeById(typeId: string): Promise<DocumentType | null>
}

export type {DocumentTypeRepositoryPort};