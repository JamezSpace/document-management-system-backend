import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class LoginStaffUseCase {
	constructor(
		private readonly staffRepository: StaffRepositoryPort,
		private readonly staffEvents: StaffEventsPort,
	) {}

	async loginStaff(identityId: string) {
		const staffDetail =
			await this.staffRepository.findStaffWithMediaByIdentityId(
				identityId,
			);

		if (!staffDetail)
			throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
				message: `Staff with identity id, ${identityId} not found.`,
			});

        // fetch assigned roles
        
	}
}

export default LoginStaffUseCase;
