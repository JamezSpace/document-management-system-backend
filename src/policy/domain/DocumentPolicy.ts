import type { DocumentType } from "./enum/documentType.enum.js";

interface DocumentPolicyPayload {
    retentionDuration: number;
    documentType: DocumentType;
}

class DocumentPolicy {
    readonly documentType: DocumentType;
    readonly retentionDuration: number;

    constructor(payload: DocumentPolicyPayload) {
        this.documentType = payload.documentType;
        this.retentionDuration = payload.retentionDuration;
    }
}

export default DocumentPolicy;