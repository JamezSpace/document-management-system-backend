interface StaffMediaMetadata {
    readonly bucketName?: string | null;
    readonly objectKey?: string | null;
    readonly storageProvider?: string | null;
    readonly assetRole?: string | null;
}

export type {StaffMediaMetadata};