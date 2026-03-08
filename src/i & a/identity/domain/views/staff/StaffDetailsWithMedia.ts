import type { StaffDetailsBasePayload } from "../type/staffDetailsBasePayload.type.js";
import AbstractStaffDetails from "./AbstractStaffDetails.js";

interface StaffDetailsWithMediaPayload extends StaffDetailsBasePayload {
    bucketName: string;
    objectKey: string;
    storageProvider: string;
    assetRole: string;
}

class StaffDetailsWithMedia extends AbstractStaffDetails {
    readonly bucketName: string;
    readonly objectKey: string;
    readonly storageProvider: string;
    readonly assetRole: string;

    constructor(payload: StaffDetailsWithMediaPayload) {
        super(payload);

        this.storageProvider = payload.storageProvider;
        this.bucketName = payload.bucketName;
        this.objectKey = payload.objectKey;
        this.assetRole = payload.assetRole;
    }
}

export default StaffDetailsWithMedia;