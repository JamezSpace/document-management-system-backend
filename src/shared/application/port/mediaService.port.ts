// TODO: implement a global service for media assets upload
interface MediaServicePort {
	upload(file: Buffer, ownerId: string): Promise<{ mediaId: string }>;
}

export type { MediaServicePort };
