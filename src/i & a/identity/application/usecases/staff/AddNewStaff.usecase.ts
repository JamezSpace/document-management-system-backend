import type { IdGeneratorPort } from "../../../../../shared/application/port/IdGenerator.port.js";
import Staff from "../../../domain/entities/staff/Staff.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/staff/StaffRepository.port.js";
import type { StaffTypeForCreation } from "../../types/staff/staff.type.js";

class AddNewStaffUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly staffEvents: StaffEventsPort,
		private readonly staffRepo: StaffRepositoryPort,
	) {}

	async addNewStaff(payload: StaffTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const staffId = "STAFF-" + uuid;

		// create a new staff
		const staff = new Staff({ id: staffId, ...payload });

		const newStaff = await this.staffRepo.save(staff);

		if (newStaff)
			await this.staffEvents.staffAdded({
				staffId: newStaff.getStaffId(),
			});

		return newStaff;
	}
}

export default AddNewStaffUseCase;
