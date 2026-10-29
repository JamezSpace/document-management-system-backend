import type ResolveStaffAuthorityUseCase from "../../../../access/application/usecases/ResolveStaffAuthority.usecase.js";
import type ActivationOrchestratorUseCase from "../../../application/usecases/staff/activateStaff/ActivationOrchestrator.usecase.js";
import type CreateStaffViaInviteUseCase from "../../../application/usecases/staff/CreateStaffViaInvite.usecase.js";
import type FetchStaffRecordUsecase from "../../../application/usecases/staff/FetchStaffRecord.usecase.js";
import type GetAllStaffUseCase from "../../../application/usecases/staff/GetAllStaff.usecase.js";

class StaffController {
	constructor(
		private readonly getAllStaffUseCase: GetAllStaffUseCase,
		private readonly createStaffViaInviteUseCase: CreateStaffViaInviteUseCase,
		private readonly staffActivationUseCase: ActivationOrchestratorUseCase,
		private readonly fetchStaffUseCase: FetchStaffRecordUsecase,
		private readonly resolveStaffAuthorityUseCase: ResolveStaffAuthorityUseCase,
	) {}

	async createStaffViaInvite(inviteId: string, activatorId: string) {
		const result = await this.createStaffViaInviteUseCase.execute(
			inviteId,
			activatorId,
		);

		return result;
	}

	async activateStaff(staffId: string, inviteId: string) {
		const activatedStaff = await this.staffActivationUseCase.execute(
			staffId, inviteId
		);

		return activatedStaff
	}

	async fetchExistingStaff(staffId: string) {
		const staff = this.fetchStaffUseCase.fetchStaff(staffId);

		return staff;
	}

	async fetchExistingStaffByAuthProviderId(authProviderId: string) {
		const staff = this.fetchStaffUseCase.fetchStaffByAuthProviderId(authProviderId);

		return staff;
	}

	async fetchAllNonDeletedStaffMembersByUnit(unitId: string) {
		const allStaffMembers =
			this.getAllStaffUseCase.getAllNonDeletedStaffMembersByUnit(unitId);

		return allStaffMembers;
	}

    async fetchAllNonDeletedStaff() {
        const allStaffMembers =
			this.getAllStaffUseCase.getAllNonDeletedStaff();

		return allStaffMembers;
    }

	async fetchStaffWithMediaForLogin(staffId: string) {
		const me = this.fetchStaffUseCase.fetchStaffWithMedia(staffId);

		return me;
	}

	async fetchStaffWithAuthority(staffId: string) {
		const staff = await this.fetchStaffWithMediaForLogin(staffId);

		if (!staff) return null;

		const authority = await this.resolveStaffAuthorityUseCase.execute(
			staff.getStaffId(),
		);

		return {
			staff: {
				id: staff.getStaffId(),
				identityId: staff.identityId,
				firstName: staff.firstName,
				middleName: staff.middleName,
				lastName: staff.lastName,
				fullName: staff.fullName,
				email: staff.email,
				staffNumber: staff.staffNumber,
				employmentType: staff.employmentType,
				status: staff.status,
				unit: staff.unit,
				office: staff.office,
				designation: staff.designation,
				media: staff.media,
				createdAt: staff.createdAt,
				updatedAt: staff.updatedAt ?? null,
			},
			authority,
		};
	}
}

export default StaffController;
