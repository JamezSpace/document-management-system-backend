import { createHash } from "node:crypto";
import type { AuditEventRepositoryPort } from "../../../../../../audit/application/ports/AuditEventRepository.port.js";
import type { MediaAssetRepositoryPort } from "../../../../../../shared/application/port/repos/MediaAssetRepository.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type {
	IdentityChangeMediaPurpose,
	MediaServicePort,
} from "../../../../../../shared/application/port/services/mediaService.port.js";
import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";

interface UploadIdentityChangeMediaInput {
	staffId: string;
	identityId: string;
	officeId: string | null;
	unitId: string | null;
	purpose: IdentityChangeMediaPurpose;
	file: Buffer;
	mimeType?: string;
	requestId?: string;
}

class UploadIdentityChangeMediaUseCase {
	constructor(
		private readonly mediaAssetRepo: MediaAssetRepositoryPort,
		private readonly mediaService: MediaServicePort,
		private readonly auditRepo: AuditEventRepositoryPort,
		private readonly transactionManager: TransactionManager,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(input: UploadIdentityChangeMediaInput) {
		const format = this.validate(input.file, input.mimeType, input.purpose);
		const uploaded = await this.mediaService.uploadIdentityChangeMedia(
			input.staffId,
			input.file,
			input.purpose,
		);
		const mediaId = `MEDIA-${this.idGenerator.generate()}`;
		const uploadedAt = new Date();
		await this.transactionManager.execute(async (tx) => {
			await this.mediaAssetRepo.save(
				{
					id: mediaId,
					storageProvider: uploaded.storageProvider,
					bucketName: uploaded.bucketName ?? null,
					objectKey: uploaded.objectKey,
					format: uploaded.format || format,
					mimeType: input.mimeType ?? this.defaultMime(format),
					sizeBytes: uploaded.sizeBytes ?? input.file.length,
					checksum: createHash("sha256").update(input.file).digest("hex"),
					uploadedBy: input.staffId,
					uploadedByType: "staff",
					uploadedAt,
				},
				tx,
			);
			await this.auditRepo.append(
				{
					id: `AUDIT-${this.idGenerator.generate()}`,
					actorId: input.staffId,
					actorType: "staff",
					action: "identity.change_request.media.upload",
					eventType: "identity_self_service",
					aggregateType: "identity",
					aggregateId: input.identityId,
					officeId: input.officeId,
					unitId: input.unitId,
					outcome: "success",
					reason: `identity_change_${input.purpose}_uploaded`,
					...(input.requestId ? { requestId: input.requestId } : {}),
					metadata: { mediaId, purpose: input.purpose, format },
				},
				tx,
			);
		});

		return {
			mediaId,
			purpose: input.purpose,
			mimeType: input.mimeType ?? this.defaultMime(format),
			uploadedAt: uploadedAt.toISOString(),
		};
	}

	private validate(
		file: Buffer,
		mimeType: string | undefined,
		purpose: IdentityChangeMediaPurpose,
	): "jpg" | "png" | "webp" | "pdf" | "svg" {
		if (file.length === 0 || file.length > 5 * 1024 * 1024) {
			this.invalid("Identity change media must be non-empty and no larger than 5 MiB");
		}
		const normalizedMime = mimeType?.toLowerCase();
		if (purpose === "signature") {
			const source = file.toString("utf8");
			const safeSvg = /<svg(?:\s|>)/i.test(source) && /<\/svg\s*>\s*$/i.test(source)
				&& !/<(?:script|foreignObject)(?:\s|>)/i.test(source)
				&& !/\son[a-z]+\s*=/i.test(source)
				&& !/javascript\s*:/i.test(source);
			if ((normalizedMime && normalizedMime !== "image/svg+xml") || !safeSvg) {
				this.invalid("Signature change media must be a safe SVG image");
			}
			return "svg";
		}

		let format: "jpg" | "png" | "webp" | "pdf" | null = null;
		if (file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff) format = "jpg";
		if (file.length >= 8 && file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) format = "png";
		if (file.length >= 12 && file.subarray(0, 4).toString("ascii") === "RIFF" && file.subarray(8, 12).toString("ascii") === "WEBP") format = "webp";
		if (file.length >= 5 && file.subarray(0, 5).toString("ascii") === "%PDF-") format = "pdf";
		const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
		if (!format || (normalizedMime && !allowedMimes.includes(normalizedMime))) {
			this.invalid("Evidence must be a valid JPEG, PNG, WebP, or PDF file");
		}
		return format;
	}

	private defaultMime(format: string): string {
		if (format === "jpg") return "image/jpeg";
		if (format === "pdf") return "application/pdf";
		if (format === "svg") return "image/svg+xml";
		return `image/${format}`;
	}

	private invalid(message: string): never {
		throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message });
	}
}

export default UploadIdentityChangeMediaUseCase;
export type { UploadIdentityChangeMediaInput };
