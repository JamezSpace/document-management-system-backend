import type { OfficeDesignationRepositoryPort } from "../../ports/repos/office/OfficeDesignationRepository.port.js";


class GetAllOfficeDesignationsUseCase {
    constructor(private readonly designationRepo: OfficeDesignationRepositoryPort) {}

    async getAllDesignations() {
        const allDesignations = await this.designationRepo.fetchAll();

        return allDesignations;
    }

    async getAllDesignationsByOffice(officeId: string) {
        const officeDesignations = await this.designationRepo.fetchAllOfficesDesignations(officeId)

        return officeDesignations;
    }
}

export default GetAllOfficeDesignationsUseCase;