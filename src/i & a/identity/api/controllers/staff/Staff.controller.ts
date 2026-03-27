import type ResolveStaffAuthority from "../../../../access/application/usecases/ResolveStaffAuthority.usecase.js";
import type ActivateStaffUseCase from "../../../application/usecases/staff/ActivateStaff.usecase.js";
import type AddNewStaffUseCase from "../../../application/usecases/staff/AddNewStaff.usecase.js";
import type EditExistingStaffUseCase from "../../../application/usecases/staff/EditExistingStaff.usecase.js";
import type FetchStaffDetailsForLoginUseCase from "../../../application/usecases/staff/FetchStaffDetailsForLogin.usecase.js";
import type FetchStaffRecordUsecase from "../../../application/usecases/staff/FetchStaffRecord.usecase.js";
import type GetAllStaffUseCase from "../../../application/usecases/staff/GetAllStaff.usecase.js";
import type RegisterNewStaffUseCase from "../../../application/usecases/staff/RegisterStaff.usecase.js";
import type Staff from "../../../domain/entities/staff/Staff.js";
import type {
	ActivateStaffType,
	CreateStaffType,
	RegisterStaffType,
} from "../../types/staff/staff.type.js";

class StaffController {
	constructor(
		private readonly getAllStaffUseCase: GetAllStaffUseCase,
		private readonly addNewStaffUseCase: AddNewStaffUseCase,
		private readonly registerNewStaffUseCase: RegisterNewStaffUseCase,
		private readonly activateStaffUseCase: ActivateStaffUseCase,
		private readonly editExistingStaffUseCase: EditExistingStaffUseCase,
		private readonly fetchStaffUseCase: FetchStaffRecordUsecase,
		private readonly resolveStaffAuthority: ResolveStaffAuthority,
	) {}

	// manual disjointed approach (not for frontend). Use registerNewStaff instead
	async addNewStaff(payload: CreateStaffType) {
		const { activatedAt, ...payloadWithoutDate } = payload;

		const newStaff = await this.addNewStaffUseCase.addNewStaff({
			activatedAt: new Date(activatedAt),
			...payloadWithoutDate,
		});

		return newStaff;
	}

	async registerNewStaff(payload: RegisterStaffType) {
		const userId =
			await this.registerNewStaffUseCase.registerNewStaff(payload);

		return userId;
	}

	async activateStaff(staffId: string, payload: ActivateStaffType) {
		const staffMediaUploaded =
			await this.activateStaffUseCase.activateStaff(staffId, payload);

		return staffMediaUploaded;
	}

	async updateExistingStaff(staffId: string, newStaff: Partial<Staff>) {
		const editedStaff = this.editExistingStaffUseCase.editExistingStaff(
			staffId,
			newStaff,
		);

		return editedStaff;
	}

	async fetchExistingStaff(staffId: string) {
		const staff = this.fetchStaffUseCase.fetchStaff(staffId);

		return staff;
	}

	async fetchAllStaffMembersByUnit(unitId: string) {
		const allStaffMembers =
			this.getAllStaffUseCase.getAllStaffMembersByUnit(unitId);

		return allStaffMembers;
	}

	async fetchStaffDetailsForLogin(uid: string) {
		const me = this.fetchStaffUseCase.fetchStaffDetails(uid);

		return me;
	}

	async fetchStaffWithAuthority(uid: string) {
		const staff = await this.fetchStaffDetailsForLogin(uid);

		if (!staff) return null;

		const authority = await this.resolveStaffAuthority.execute(staff.getStaffId());

		return {
			...staff,
			authority,
		};
	}
}

export default StaffController;
