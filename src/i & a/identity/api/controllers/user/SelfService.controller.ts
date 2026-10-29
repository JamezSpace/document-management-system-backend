import type ResolveStaffAuthorityUseCase from "../../../../access/application/usecases/ResolveStaffAuthority.usecase.js";
import type GetOwnSettingsUseCase from "../../../application/usecases/user/selfService/GetOwnSettings.usecase.js";
import type ListOwnIdentityChangesUseCase from "../../../application/usecases/user/selfService/ListOwnIdentityChanges.usecase.js";
import type ReplaceOwnProfilePictureUseCase from "../../../application/usecases/user/selfService/ReplaceOwnProfilePicture.usecase.js";
import type RequestIdentityChangeUseCase from "../../../application/usecases/user/selfService/RequestIdentityChange.usecase.js";
import type UpdateOwnProfileUseCase from "../../../application/usecases/user/selfService/UpdateOwnProfile.usecase.js";
import type UploadIdentityChangeMediaUseCase from "../../../application/usecases/user/selfService/UploadIdentityChangeMedia.usecase.js";
import type { ActorContext } from "../../../../../security/application/type/authorization.type.js";

class SelfServiceController {
	constructor(
		private readonly getOwnSettings: GetOwnSettingsUseCase,
		private readonly updateOwnProfile: UpdateOwnProfileUseCase,
		private readonly replaceOwnProfilePicture: ReplaceOwnProfilePictureUseCase,
		private readonly requestIdentityChange: RequestIdentityChangeUseCase,
		private readonly listOwnChanges: ListOwnIdentityChangesUseCase,
		private readonly uploadIdentityChangeMedia: UploadIdentityChangeMediaUseCase,
		private readonly resolveStaffAuthority: ResolveStaffAuthorityUseCase,
	) {}

	async getSettings(actor: ActorContext) {
		const [settings, authority] = await Promise.all([
			this.getOwnSettings.execute(actor.identityId, actor.staffId),
			this.resolveStaffAuthority.execute(actor.staffId),
		]);
		return { ...settings, authority };
	}

	async updateProfile(
		actor: ActorContext,
		phoneNumber: string,
		expectedRevision: number,
		requestId: string,
	) {
		return this.updateOwnProfile.execute({
			identityId: actor.identityId,
			staffId: actor.staffId,
			officeId: actor.officeId,
			unitId: actor.unitId,
			phoneNumber,
			expectedRevision,
			requestId,
		});
	}

	async replaceProfilePicture(
		actor: ActorContext,
		file: { buffer: Buffer; mimeType?: string },
		expectedRevision: number,
		requestId: string,
	) {
		return this.replaceOwnProfilePicture.execute({
			identityId: actor.identityId,
			staffId: actor.staffId,
			officeId: actor.officeId,
			unitId: actor.unitId,
			file: file.buffer,
			...(file.mimeType ? { mimeType: file.mimeType } : {}),
			expectedRevision,
			requestId,
		});
	}

	async createChangeRequest(
		actor: ActorContext,
		payload: {
			changes: {
				firstName?: string;
				middleName?: string | null;
				lastName?: string;
				email?: string;
				signature?: string;
			};
			reason: string;
			evidenceMediaIds?: string[];
		},
		requestId: string,
	) {
		return this.requestIdentityChange.execute({
			identityId: actor.identityId,
			staffId: actor.staffId,
			officeId: actor.officeId,
			unitId: actor.unitId,
			changes: payload.changes,
			reason: payload.reason,
			evidenceMediaIds: payload.evidenceMediaIds ?? [],
			requestId,
		});
	}

	async uploadChangeRequestMedia(
		actor: ActorContext,
		payload: {
			purpose: "evidence" | "signature";
			file: { buffer: Buffer; mimeType?: string };
		},
		requestId: string,
	) {
		return this.uploadIdentityChangeMedia.execute({
			identityId: actor.identityId,
			staffId: actor.staffId,
			officeId: actor.officeId,
			unitId: actor.unitId,
			purpose: payload.purpose,
			file: payload.file.buffer,
			...(payload.file.mimeType ? { mimeType: payload.file.mimeType } : {}),
			requestId,
		});
	}

	async listChangeRequests(actor: ActorContext) {
		return this.listOwnChanges.execute(actor.identityId);
	}
}

export default SelfServiceController;
