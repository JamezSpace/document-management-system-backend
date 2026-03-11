import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class FetchStaffDetailsForLoginUseCase {
    constructor(private readonly staffRepo: StaffRepositoryPort) {}

    async fetchStaffDetails(uid: string) {
        const staffDetails = await this.staffRepo.findStaffWithMediaByIdentityId(uid)

        return staffDetails;
    }
}

export default FetchStaffDetailsForLoginUseCase;