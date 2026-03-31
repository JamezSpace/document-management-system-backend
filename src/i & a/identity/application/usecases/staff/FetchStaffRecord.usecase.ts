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

    async fetchStaffByAuthProviderId(authProviderId: string) {
        const staff = await this.staffRepo.findStaffByAuthProviderId(authProviderId);

        return staff;
    }
}

export default FetchStaffRecordUsecase;
