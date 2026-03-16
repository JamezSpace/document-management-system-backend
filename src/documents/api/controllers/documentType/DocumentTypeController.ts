import type CreateDocumentTypeUsecase from "../../../application/usecases/documentType/CreateDocType.usecase.js";
import type GetAllDocumentTypesUsecase from "../../../application/usecases/documentType/GetAllDocTypes.usecase.js";

class DocumentTypeController {
    constructor(
        private readonly createUseCase: CreateDocumentTypeUsecase,
        private readonly getAllUseCase: GetAllDocumentTypesUsecase,
    ){}

    async createDocumentType(actorId: string, payload:{
        code: string,
        name: string
    }) {
        const newDocumentType = await this.createUseCase.createDocType(actorId, payload);

        return newDocumentType;
    }

    async getAllDocTypes() {
        const allDocTypes = await this.getAllUseCase.getAll()

        return allDocTypes;
    }
}

export default DocumentTypeController;