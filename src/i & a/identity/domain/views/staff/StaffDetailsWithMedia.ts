import type { StaffMediaMetadata } from "../metadata/StaffMedia.meta.js";
import type { StaffDetailsBasePayload } from "../type/staffDetailsBasePayload.type.js";
import AbstractStaffDetails from "./AbstractStaffDetails.js";

interface StaffDetailsWithMediaPayload extends StaffDetailsBasePayload {
    bucketName: string;
    objectKey: string;
    storageProvider: string;
    assetRole: string;
}

class StaffDetailsWithMedia extends AbstractStaffDetails {
    readonly media: StaffMediaMetadata;    

    constructor(payload: StaffDetailsWithMediaPayload) {
        super(payload);

        this.media = {
            assetRole: payload.assetRole,
            storageProvider: payload.storageProvider,
            bucketName: payload.bucketName,
            objectKey: payload.objectKey
        }
    }
}

export default StaffDetailsWithMedia;