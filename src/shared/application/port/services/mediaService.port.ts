// TODO: implement a global service for media assets uploadDoc
interface UploadedMediaStorageDetails {
	storageProvider: string;
	bucketName?: string | null;
	objectKey: string;
	sizeBytes?: number;
    format: string;
}

interface UploadedMediaMap {
	signatureFile?: UploadedMediaStorageDetails;
	profilePic?: UploadedMediaStorageDetails;
}

type IdentityChangeMediaPurpose = "evidence" | "signature";

interface MediaReadOptions {
	outputFormat?: "png";
}

interface MediaServicePort {
	uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string }>;

	uploadStaffMedia(
		staffId: string,
		mediaUploads: {
			signatureFile?: Buffer;
			profilePic?: Buffer;
		},
	): Promise<void>;

	uploadProfilePicture(
		staffId: string,
		file: Buffer,
	): Promise<UploadedMediaStorageDetails>;

	uploadIdentityChangeMedia(
		staffId: string,
		file: Buffer,
		purpose: IdentityChangeMediaPurpose,
	): Promise<UploadedMediaStorageDetails>;

	uploadOnboardingMedia(
		sessionId: string,
		mediaUploads: {
			signatureFile?: Buffer;
			profilePic?: Buffer;
		},
	): Promise<UploadedMediaMap>;

	resolveMediaToPublicURL(mediaDetailsFromDB: {
		objectKey: string | null;
        format: string | null;
	}): string | null;

	readMedia(mediaDetailsFromDB: {
		objectKey: string;
		format: string;
	}, options?: MediaReadOptions): Promise<Buffer | null>;

}

export type {
	IdentityChangeMediaPurpose,
	MediaReadOptions,
	MediaServicePort,
	UploadedMediaMap,
	UploadedMediaStorageDetails,
};
