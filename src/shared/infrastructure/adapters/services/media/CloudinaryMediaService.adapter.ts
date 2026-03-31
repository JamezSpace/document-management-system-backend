import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import type { MediaServicePort } from "../../../../application/port/services/mediaService.port.js";

class CloudinaryMediaServiceAdapter implements MediaServicePort {
	constructor() {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
			api_key: process.env.CLOUDINARY_API_KEY ?? "",
			api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
			secure: process.env.CLOUDINARY_SECURE !== "false",
		});
	}

	private uploadBuffer(
		buffer: Buffer,
		options: UploadApiOptions,
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				options,
				(error, result) => {
					if (error || !result) {
						reject(error ?? new Error("Cloudinary upload failed"));
						return;
					}
					resolve(result);
				},
			);

			stream.end(buffer);
		});
	}

	async uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string }> {
		const result = await this.uploadBuffer(file, {
			folder: "documents",
			resource_type: "auto",
			public_id: `doc_${ownerId}_${Date.now()}`,
		});

		return { mediaId: result.public_id };
	}

	async uploadStaffMedia(
		staffId: string,
		mediaUploads: { signatureFile: Buffer; profilePic: Buffer },
	): Promise<void> {
		await Promise.all([
			this.uploadBuffer(mediaUploads.profilePic, {
				folder: `staff/${staffId}`,
				resource_type: "image",
				public_id: "profile_picture",
				overwrite: true,
			}),
			this.uploadBuffer(mediaUploads.signatureFile, {
				folder: `staff/${staffId}`,
				resource_type: "image",
				public_id: "signature",
				overwrite: true,
			}),
		]);
	}
}

export default CloudinaryMediaServiceAdapter;
