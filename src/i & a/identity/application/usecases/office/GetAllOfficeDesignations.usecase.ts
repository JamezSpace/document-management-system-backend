import type { OfficeDesignationRepositoryPort } from "../../ports/repos/office/OfficeDesignationRepository.port.js";


class GetAllOfficeDesignationUseCase {
    constructor(private readonly designationRepo: OfficeDesignationRepositoryPort) {}

    async getAllDesignations() {
        const allDesignations = await this.designationRepo.fetchAll();

        return allDesignations;
    }

    async getAllDesignationsByOffice(officeId: string) {
        const officeDesignations = await this.designationRepo.fetchAllDesignationsWithinAnOffice(officeId)

        return officeDesignations;
    }
}

export default GetAllOfficeDesignationUseCase;