// TODO: implement a global service for media assets uploadDoc
interface MediaServicePort {
	uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string }>;

    uploadStaffMedia(): Promise<>
}

export type { MediaServicePort };

