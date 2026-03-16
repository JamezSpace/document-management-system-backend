import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetAllDocumentsByStaffUseCase {
    constructor(private readonly documentsRepo: DocumentRepositoryPort){}

    async getAllDocumentsAuthoredByStaff(staffId:string) {
        const allDocsByStaff = await this.documentsRepo.fetchAllDocumentsAuthoredByStaff(staffId);

        return allDocsByStaff;
    }
}

export default GetAllDocumentsByStaffUseCase;