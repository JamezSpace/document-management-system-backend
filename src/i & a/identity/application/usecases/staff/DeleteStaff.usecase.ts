import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class DeleteStaffUseCase {
	constructor(private readonly staffRepo: StaffRepositoryPort) {}

	async deleteStaff(staffId: string) {
		await this.staffRepo.deleteStaff(staffId);
	}
}

export default DeleteStaffUseCase;
