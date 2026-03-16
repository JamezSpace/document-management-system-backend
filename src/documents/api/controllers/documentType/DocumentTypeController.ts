import type CreateDocumentTypeUsecase from "../../../application/usecases/documentType/CreateDocType.usecase.js";

class DocumentTypeController {
    constructor(
        private readonly createUseCase: CreateDocumentTypeUsecase
    ){}

    async createDocumentType(actorId: string, payload:{
        code: string,
        name: string
    }) {
        const newDocumentType = await this.createUseCase.createDocType(actorId, payload);

        return newDocumentType;
    }
}

export default DocumentTypeController;