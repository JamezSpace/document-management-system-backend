import type { OfficeRepositoryPort } from "../../ports/repos/office/OfficeRepository.port.js";

class GetAllOfficesUseCase {
    constructor(private readonly officeRepo: OfficeRepositoryPort) {}

    async getAllOffices() {
        const allOffices = await this.officeRepo.fetchAllOffices();

        return allOffices;
    }
}

export default GetAllOfficesUseCase;