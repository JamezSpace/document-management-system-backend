import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetAllDocsAddressedToStaffUseCase {
    constructor(private readonly documentsRepo: DocumentRepositoryPort){}
    
    async execute(staffId: string) {
        const allDocsAddresssedToStaff = await this.documentsRepo.fetchInboxDocumentsForStaff(staffId);

        return allDocsAddresssedToStaff;
    }
}

export default GetAllDocsAddressedToStaffUseCase;