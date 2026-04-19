import type { MediaServicePort } from "../../../../application/port/services/mediaService.port.js";

class MediaServiceAdapter implements MediaServicePort {
    async uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string; }> {
        return {mediaId: '124r4'};
    }

    async uploadStaffMedia(staffId: string, mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer; }): Promise<void> {
        return;
    }

	async uploadOnboardingMedia(
		sessionId: string,
		mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer },
	): Promise<{
		signatureFile?: {
			storageProvider: string;
			bucketName?: string | null;
			objectKey: string;
			sizeBytes?: number;
		};
		profilePic?: {
			storageProvider: string;
			bucketName?: string | null;
			objectKey: string;
			sizeBytes?: number;
		};
	}> {
		const result: {
			profilePic?: {
				storageProvider: string;
				bucketName?: string | null;
				objectKey: string;
				sizeBytes?: number;
			};
			signatureFile?: {
				storageProvider: string;
				bucketName?: string | null;
				objectKey: string;
				sizeBytes?: number;
			};
		} = {};

		if (mediaUploads.profilePic) {
			result.profilePic = {
				storageProvider: "LOCAL",
				bucketName: "mock",
				objectKey: `onboarding/${sessionId}/profile_picture`,
				sizeBytes: mediaUploads.profilePic.length,
			};
		}

		if (mediaUploads.signatureFile) {
			result.signatureFile = {
				storageProvider: "LOCAL",
				bucketName: "mock",
				objectKey: `onboarding/${sessionId}/signature`,
				sizeBytes: mediaUploads.signatureFile.length,
			};
		}

		return result;
	}
}

export default MediaServiceAdapter;
