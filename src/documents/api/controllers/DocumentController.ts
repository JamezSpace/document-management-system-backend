import type DocumentCreation from "../../application/usecases/documents/CreateDocument.usecase.js";
import type { DocumentSchemaTypeForCreation } from "../types/document.type.js";

class DocumentController {
    constructor(private readonly createDocumentUseCase: DocumentCreation) {}

    async createDocument(payload: DocumentSchemaTypeForCreation) {
        const newDoc = await this.createDocumentUseCase.createDocument({
            lifecycle: {
                currentState: null,
                enteredBy: payload.createdBy,
                enteredAt: new Date().toString()
            }, 
            ...payload
        })

        return newDoc;
    }
}

export default DocumentController;