import type DocumentCreation from "../../application/usecases/CreateDocument.usecase.js";
import type { DocumentSchemaTypeForCreation } from "../types/document.type.js";

class DocumentController {
    constructor(private readonly createDocumentUseCase: DocumentCreation) {}

    async createDocument(payload: DocumentSchemaTypeForCreation) {
        const newDoc = await this.createDocumentUseCase.createDocument({
            
        })

        return newDoc;
    }
}

export default DocumentController;