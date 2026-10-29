import type { ActorContext } from "../../../../../security/application/type/authorization.type.js";
import type GetAdministrativeStaffUseCase from "../../../application/usecases/staff/administration/GetAdministrativeStaff.usecase.js";
import type ListAdministrativeStaffUseCase from "../../../application/usecases/staff/administration/ListAdministrativeStaff.usecase.js";
import type ListIdentityChangeReviewsUseCase from "../../../application/usecases/staff/administration/ListIdentityChangeReviews.usecase.js";
import type ReviewIdentityChangeUseCase from "../../../application/usecases/staff/administration/ReviewIdentityChange.usecase.js";
import type TransitionStaffStatusUseCase from "../../../application/usecases/staff/administration/TransitionStaffStatus.usecase.js";
import type UpdateAdministrativeStaffUseCase from "../../../application/usecases/staff/administration/UpdateAdministrativeStaff.usecase.js";
import type { AdministrativeStaffListQuery } from "../../types/staff/staffAdministration.type.js";

class StaffAdministrationController {
	constructor(
		private readonly getStaffUseCase: GetAdministrativeStaffUseCase,
		private readonly listStaffUseCase: ListAdministrativeStaffUseCase,
		private readonly updateStaffUseCase: UpdateAdministrativeStaffUseCase,
		private readonly transitionStatusUseCase: TransitionStaffStatusUseCase,
		private readonly listReviewsUseCase: ListIdentityChangeReviewsUseCase,
		private readonly reviewChangeUseCase: ReviewIdentityChangeUseCase,
	) {}

	getStaff(staffId: string) {
		return this.getStaffUseCase.execute(staffId);
	}

	listStaff(query: AdministrativeStaffListQuery) {
		const page = query.page ?? 1;
		const limit = query.pageSize ?? 25;
		return this.listStaffUseCase.execute({
			limit,
			offset: (page - 1) * limit,
			...(query.status ? { status: query.status } : {}),
			...(query.unitId ? { unitId: query.unitId } : {}),
			...(query.search ? { search: query.search } : {}),
		});
	}

	updateStaff(
		actor: ActorContext,
		staffId: string,
		changes: Parameters<UpdateAdministrativeStaffUseCase["execute"]>[0]["changes"],
		reason: string,
		expectedRevision: number,
		requestId: string,
	) {
		return this.updateStaffUseCase.execute({
			staffId,
			actorId: actor.staffId,
			actorOfficeId: actor.officeId,
			actorUnitId: actor.unitId,
			changes,
			reason,
			expectedRevision,
			requestId,
		});
	}

	transitionStatus(
		actor: ActorContext,
		staffId: string,
		toStatus: Parameters<TransitionStaffStatusUseCase["execute"]>[0]["toStatus"],
		reason: string,
		expectedRevision: number,
		requestId: string,
	) {
		return this.transitionStatusUseCase.execute({
			staffId,
			actorId: actor.staffId,
			actorOfficeId: actor.officeId,
			actorUnitId: actor.unitId,
			actorCapabilities: [...new Set(actor.grants.map((grant) => grant.capability))],
			toStatus,
			reason,
			expectedRevision,
			requestId,
		});
	}

	listIdentityChanges(query: {
		page?: number;
		pageSize?: number;
		status?: "pending" | "approved" | "rejected" | "applied" | "cancelled";
	}) {
		const page = query.page ?? 1;
		const limit = query.pageSize ?? 25;
		return this.listReviewsUseCase.execute({
			limit,
			offset: (page - 1) * limit,
			...(query.status ? { status: query.status } : {}),
		});
	}

	reviewIdentityChange(
		actor: ActorContext,
		requestId: string,
		decision: "approve" | "reject",
		reason: string,
		requestTraceId: string,
	) {
		return this.reviewChangeUseCase.execute({
			requestId,
			reviewerId: actor.staffId,
			reviewerOfficeId: actor.officeId,
			reviewerUnitId: actor.unitId,
			decision,
			reason,
			requestTraceId,
		});
	}
}

export default StaffAdministrationController;
