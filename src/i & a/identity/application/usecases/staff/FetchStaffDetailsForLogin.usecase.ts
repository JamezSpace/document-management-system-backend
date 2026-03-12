import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class FetchStaffDetailsForLoginUseCase {
    constructor(private readonly staffRepo: StaffRepositoryPort) {}

    
}

export default FetchStaffDetailsForLoginUseCase;