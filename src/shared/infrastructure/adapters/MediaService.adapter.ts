import type { MediaServicePort } from "../../application/port/services/mediaService.port.js";

class MediaServiceAdapter implements MediaServicePort {
    async uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string; }> {
        return {mediaId: '124r4'};
    }

    async uploadStaffMedia(staffId: string, mediaUploads: { signatureFile: Buffer; profilePic: Buffer; }): Promise<void> {
        return;
    }
}

export default MediaServiceAdapter;