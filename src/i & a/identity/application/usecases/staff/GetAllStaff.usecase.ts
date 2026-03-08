import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class GetAllStaffUseCase {
	constructor(
		private readonly staffRepo: StaffRepositoryPort,
	) {}

    async getAllStaffMembersByUnit(unitId: string) {
        const staffMembers = await this.staffRepo.fetchAllStaffMembersByUnit(unitId)

        return staffMembers;
    }
}

export default GetAllStaffUseCase;