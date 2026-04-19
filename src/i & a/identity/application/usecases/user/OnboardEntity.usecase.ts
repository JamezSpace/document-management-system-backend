import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import { createHash } from "node:crypto";
import type { MediaAssetRepositoryPort } from "../../../../../shared/application/port/repos/MediaAssetRepository.port.js";
import type { MediaServicePort } from "../../../../../shared/application/port/services/mediaService.port.js";
import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import OnboardingSession from "../../../domain/entities/user/OnboardingSession.js";
import { OnboardingSessionStatus } from "../../../domain/enum/onboardingSessionStatus.enum.js";
import type { StaffMediaRepositoryPort } from "../../ports/repos/media/MediaRepository.port.js";
import type { InviteRepositoryPort } from "../../ports/repos/user/InviteRepository.port.js";
import type { OnboardingSessionRepositoryPort } from "../../ports/repos/user/OnboardingSessionRepository.port.js";
import type { TokenServicePort } from "../../ports/services/TokenService.port.js";
import type { OnboardingSessionInit } from "../../types/user/onboardingSession.type.js";
import type Invite from "../../../domain/entities/user/Invite.js";
import { timeStamp } from "node:console";

type UpdatableInviteField = Exclude<keyof Invite, "id" | "createdAt">;

class OnboardingEntityUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly tokenService: TokenServicePort,
		private readonly mediaService: MediaServicePort,
		private readonly mediaAssetRepo: MediaAssetRepositoryPort,
		private readonly mediaRepo: StaffMediaRepositoryPort,
		private readonly inviteRepo: InviteRepositoryPort,
		private readonly onboardingSessionRepo: OnboardingSessionRepositoryPort,
	) {}

	async getInvite(token: string) {
		const isTokenValid = this.tokenService.validateToken(token);

		if (!isTokenValid)
			throw new ApplicationError(
				ApplicationErrorEnum.INVALID_CREDENTIALS,
				{
					message:
						"The provided token is not a valid security string.",
				},
			);

		const invite = await this.inviteRepo.findByToken(token);

		return invite;
	}

	async initOnboardingSession(payload: OnboardingSessionInit) {
		const newSession = new OnboardingSession({
			id: "ONBRD-SESS-" + this.idGenerator.generate(),
			invite_id: payload.inviteId,
			current_step: 1,
			email: payload.email,
			started_at: new Date(),
			status: OnboardingSessionStatus.IN_PROGRESS,
		});

		const savedSession = await this.onboardingSessionRepo.save(newSession);

		return savedSession;
	}

	async getOnboardingSessionByInviteId(inviteId: string) {
		const session =
			await this.onboardingSessionRepo.findSessionByInviteId(inviteId);

		return session;
	}

	async updateInviteField(
		inviteId: string,
		fieldToUpdate: UpdatableInviteField,
		valueToInsert: Invite[UpdatableInviteField],
	) {
		const updatedInvite = await this.inviteRepo.update(inviteId, {
			[fieldToUpdate]: valueToInsert,
			updatedAt: new Date(),
		} as Partial<Invite>);

		return updatedInvite;
	}

	async updateOnboardingSession(
		sessionId: string,
		payload: {
			primaryData: {
				firstName: string;
				lastName: string;
				middleName: string;
				email: string;
				staffId: string;
			};
			currentStep: number;
		},
	) {
		const updatedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
				primary_data: payload.primaryData,
				current_step: payload.currentStep,
				last_active_at: new Date(),
			},
		);

		return updatedSession;
	}

	async completeOnboardingSession(sessionId: string, currentStep: number) {
		const completedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
                completed_at: new Date(),
                current_step: currentStep,
				status: OnboardingSessionStatus.COMPLETED,
			},
		);

		return completedSession;
	}

	async uploadOnboardingMedia(
		sessionId: string,
		payload: {
			profilePic?: { buffer: Buffer; mimeType?: string };
			signatureFile?: { buffer: Buffer; mimeType?: string };
			currentStep: number;
		},
	) {
		if (!payload.profilePic && !payload.signatureFile) {
			throw new ApplicationError(
				ApplicationErrorEnum.INCOMPLETE_REQUEST,
				{
					message: "At least one media file must be provided.",
				},
			);
		}

		const session =
			await this.onboardingSessionRepo.findSessionById(sessionId);
		if (!session) {
			throw new ApplicationError(ApplicationErrorEnum.INVITE_NOT_FOUND, {
				message: `Onboarding session ${sessionId} not found.`,
			});
		}

		const uploadedMedia = await this.mediaService.uploadOnboardingMedia(
			sessionId,
			{
				...(payload.profilePic
					? { profilePic: payload.profilePic.buffer }
					: {}),
				...(payload.signatureFile
					? { signatureFile: payload.signatureFile.buffer }
					: {}),
			},
		);

		let profilePictureMediaId: string | undefined;
		let signatureMediaId: string | undefined;

		if (uploadedMedia.profilePic && payload.profilePic) {
			profilePictureMediaId = "MEDIA-" + this.idGenerator.generate();
			await this.mediaAssetRepo.save({
				id: profilePictureMediaId,
				storageProvider: uploadedMedia.profilePic.storageProvider,
				bucketName: uploadedMedia.profilePic.bucketName ?? null,
				objectKey: uploadedMedia.profilePic.objectKey,
				mimeType:
					payload.profilePic.mimeType ?? "application/octet-stream",
				sizeBytes:
					uploadedMedia.profilePic.sizeBytes ??
					payload.profilePic.buffer.length,
				checksum: createHash("sha256")
					.update(payload.profilePic.buffer)
					.digest("hex"),
				uploadedBy: sessionId,
				uploadedByType: "onboarding_session",
				uploadedAt: new Date(),
			});
		}

		if (uploadedMedia.signatureFile && payload.signatureFile) {
			signatureMediaId = "MEDIA-" + this.idGenerator.generate();

			await this.mediaAssetRepo.save({
				id: signatureMediaId,
				storageProvider: uploadedMedia.signatureFile.storageProvider,
				bucketName: uploadedMedia.signatureFile.bucketName ?? null,
				objectKey: uploadedMedia.signatureFile.objectKey,
				mimeType:
					payload.signatureFile.mimeType ??
					"application/octet-stream",
				sizeBytes:
					uploadedMedia.signatureFile.sizeBytes ??
					payload.signatureFile.buffer.length,
				checksum: createHash("sha256")
					.update(payload.signatureFile.buffer)
					.digest("hex"),
				uploadedBy: sessionId,
				uploadedByType: "onboarding_session",
				uploadedAt: new Date(),
			});
		}

		await this.mediaRepo.assignOnboardingSessionMedia(sessionId, {
			...(profilePictureMediaId ? { profilePictureMediaId } : {}),
			...(signatureMediaId ? { signatureMediaId } : {}),
		});

		const updatedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
				current_step: payload.currentStep,
				last_active_at: new Date(),
			},
		);

		return updatedSession;
	}
}

export default OnboardingEntityUseCase;
