import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class FetchStaffRecordUsecase {
	constructor(private readonly staffRepo: StaffRepositoryPort) {}

	async fetchStaff(staffId: string) {
		const staff = await this.staffRepo.findStaffWithoutMediaById(staffId);

		return staff;
	}

    async fetchStaffDetails(uid: string) {
        const staffDetails = await this.staffRepo.findStaffWithMediaByIdentityId(uid)

        return staffDetails;
    }
}

export default FetchStaffRecordUsecase;
