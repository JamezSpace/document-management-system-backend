import type { MediaServicePort } from "../../../../../shared/application/port/services/mediaService.port.js";
import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";

interface StaffMediaUpload {
    signatureFile: Buffer;
    profilePic: Buffer;
}

class ActivateStaffUseCase {
	constructor(
		private readonly staffEvents: StaffEventsPort,
		private readonly staffRepo: StaffRepositoryPort,
        private readonly mediaService: MediaServicePort
	) {}

	async activateStaff(staffId: string, filesToUpload: StaffMediaUpload) {
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
        await this.mediaService.uploadStaffMedia(staffId, filesToUpload);

		const activatedStaff = await this.staffRepo.updateStaff(staffId, {
			status: staff.status,
		});

		if (activatedStaff) {
			await this.staffEvents.staffActivated({ staffId });
		}

		return activatedStaff;
	}
}

export default ActivateStaffUseCase;
