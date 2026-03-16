import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetDocumentByIdUsecase {
    constructor(
        private readonly documentRepo: DocumentRepositoryPort
    ){}

    async getDocById(docId: string) {
        const doc = this.documentRepo.findDocumentById(docId);

        return doc;
    }
}

export default GetDocumentByIdUsecase;