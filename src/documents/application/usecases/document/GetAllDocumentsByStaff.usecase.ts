import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetAllDocumentsByStaffUseCase {
    constructor(private readonly documentsRepo: DocumentRepositoryPort){}

    async getDocumentsAuthoredOrAddressedToStaff(staffId:string) {
        const allDocsByStaff = await this.documentsRepo.fetchDocumentsAuthoredByStaff(staffId);

        return allDocsByStaff;
    }
}

export default GetAllDocumentsByStaffUseCase;