import { createHash } from "node:crypto";
import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { IdentityGovernancePolicyPort } from "../../../../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { MediaAssetRepositoryPort } from "../../../../../../shared/application/port/repos/MediaAssetRepository.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { MediaServicePort } from "../../../../../../shared/application/port/services/mediaService.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { StaffMediaRepositoryPort } from "../../../ports/repos/entities/media/StaffMediaRepository.port.js";
import type { SelfServiceRepositoryPort } from "../../../ports/repos/entities/user/SelfServiceRepository.port.js";

interface ReplaceOwnProfilePictureInput {
	identityId: string;
	staffId: string;
	officeId: string | null;
	unitId: string | null;
	file: Buffer;
	mimeType?: string;
	expectedRevision: number;
	requestId?: string;
}

class ReplaceOwnProfilePictureUseCase {
	constructor(
		private readonly settingsRepo: SelfServiceRepositoryPort,
		private readonly mediaAssetRepo: MediaAssetRepositoryPort,
		private readonly staffMediaRepo: StaffMediaRepositoryPort,
		private readonly policy: IdentityGovernancePolicyPort,
		private readonly mediaService: MediaServicePort,
		private readonly auditRepo: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: ReplaceOwnProfilePictureInput) {
		const governance = await this.policy.evaluateField("profilePicture");
		if (governance.decision.mode !== "direct") {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Profile picture cannot be changed directly under the active policy",
				details: { reasonCode: governance.decision.reasonCode },
			});
		}
		const format = this.validateImage(input.file, input.mimeType);
		const current = await this.settingsRepo.findSettings(input.identityId, input.staffId);
		if (!current) {
			throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
				message: "The authenticated identity could not be found",
			});
		}
		if (current.revision !== input.expectedRevision) {
			this.revisionConflict(current.revision);
		}

		const uploaded = await this.mediaService.uploadProfilePicture(input.staffId, input.file);
		const mediaId = `MEDIA-${this.idGenerator.generate()}`;
		const assignedAt = new Date();
		const revision = await this.transactionManager.execute(async (tx) => {
			const newRevision = await this.settingsRepo.incrementRevision(
				input.identityId,
				input.expectedRevision,
				tx,
			);
			if (newRevision === null) this.revisionConflict(current.revision);

			await this.mediaAssetRepo.save(
				{
					id: mediaId,
					storageProvider: uploaded.storageProvider,
					bucketName: uploaded.bucketName ?? null,
					objectKey: uploaded.objectKey,
					format: uploaded.format || format,
					mimeType: input.mimeType ?? `image/${format}`,
					sizeBytes: uploaded.sizeBytes ?? input.file.length,
					checksum: createHash("sha256").update(input.file).digest("hex"),
					uploadedBy: input.staffId,
					uploadedByType: "staff",
					uploadedAt: assignedAt,
				},
				tx,
			);
			await this.staffMediaRepo.deactivateByRole(input.staffId, "PROFILE_PICTURE", tx);
			await this.staffMediaRepo.save(
				{
					staffId: input.staffId,
					mediaId,
					assetRole: "PROFILE_PICTURE",
					isActive: true,
					assignedAt,
				},
				tx,
			);

			await this.auditRepo.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.staffId,
					actorType: "staff",
					action: "identity.profile.picture.replace",
					eventType: "identity_self_service",
					aggregateType: "identity",
					aggregateId: input.identityId,
					officeId: input.officeId,
					unitId: input.unitId,
					outcome: "success",
					reason: governance.decision.reasonCode,
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: {
						mediaId,
						policyKey: governance.policyKey,
						policyVersion: governance.policyVersion,
						previousRevision: input.expectedRevision,
						newRevision,
					},
				},
				tx,
			);
			return newRevision!;
		});

		return {
			status: "applied" as const,
			revision,
			profilePictureUrl: this.mediaService.resolveMediaToPublicURL({
				objectKey: uploaded.objectKey,
				format: uploaded.format,
			}),
			governanceDecision: {
				policyKey: governance.policyKey,
				policyVersion: governance.policyVersion,
				reasonCode: governance.decision.reasonCode,
				requirements: governance.decision.requirements,
			},
		};
	}

	private validateImage(file: Buffer, mimeType?: string): "jpg" | "png" | "webp" {
		if (file.length === 0 || file.length > 5 * 1024 * 1024) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Profile picture must be non-empty and no larger than 5 MiB",
			});
		}
		const normalizedMime = mimeType?.toLowerCase();
		let detected: "jpg" | "png" | "webp" | null = null;
		if (file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff) detected = "jpg";
		if (file.length >= 8 && file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) detected = "png";
		if (file.length >= 12 && file.subarray(0, 4).toString("ascii") === "RIFF" && file.subarray(8, 12).toString("ascii") === "WEBP") detected = "webp";
		const allowedMime = !normalizedMime || ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(normalizedMime);
		if (!detected || !allowedMime) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Profile picture must be a valid JPEG, PNG, or WebP image",
			});
		}
		return detected;
	}

	private revisionConflict(currentRevision: number): never {
		throw new ApplicationError(ApplicationErrorEnum.REVISION_CONFLICT, {
			message: "The profile changed after it was loaded",
			details: { currentRevision },
		});
	}
}

export default ReplaceOwnProfilePictureUseCase;
export type { ReplaceOwnProfilePictureInput };
