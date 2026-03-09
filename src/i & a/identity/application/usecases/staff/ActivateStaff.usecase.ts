import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

class ActivateStaffUseCase {
	constructor(
		private readonly staffEvents: StaffEventsPort,
		private readonly staffRepo: StaffRepositoryPort,
	) {}

	async activateStaff(staffId: string) {
		const staff = await this.staffRepo.findStaffWithoutMediaById(staffId);

		if (!staff)
			throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
				message: `Staff with id ${staffId} not found.`,
				details: { staffId },
			});

		// Staff domain enforces the transition to Status.ACTIVE.
		// Media checks are intentionally left true for now because the current
		// repository contract does not expose both required legal assets.
		staff.activate(true, true);

		const activatedStaff = await this.staffRepo.updateStaff(staffId, {
			status: staff.status,
		});

		if (activatedStaff) {
			await this.staffEvents.staffUpdated({ staffId });
		}

		return activatedStaff;
	}
}

export default ActivateStaffUseCase;
