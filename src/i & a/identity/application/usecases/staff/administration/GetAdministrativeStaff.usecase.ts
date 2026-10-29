import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { StaffAdministrationRepositoryPort } from "../../../ports/repos/entities/staff/StaffAdministrationRepository.port.js";

class GetAdministrativeStaffUseCase {
	constructor(private readonly repository: StaffAdministrationRepositoryPort) {}

	async execute(staffId: string) {
		const staff = await this.repository.findById(staffId);
		if (!staff) {
			throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
				message: "Staff record not found",
			});
		}
		return staff;
	}
}

export default GetAdministrativeStaffUseCase;
