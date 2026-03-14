import type { DocumentType } from "../../shared/application/enum/documentTypes.enum.js";

interface DocumentRetentionPolicyPayload {
    id: string;
    archivalRequired: boolean;
    policyVersion?: number;
    retentionDuration: number;
    documentType: DocumentType;
    effectiveFrom: Date;
    createdAt?: Date;
}

class DocumentRetentionPolicy {
    readonly id: string;
    readonly policyVersion: number | null;
    readonly archivalRequired: boolean;
    readonly documentType: DocumentType;
    readonly retentionDuration: number;
    readonly effectiveFrom: Date;
    readonly createdAt: Date;

    constructor(payload: DocumentRetentionPolicyPayload) {
        this.id = payload.id;
        this.documentType = payload.documentType;
        this.retentionDuration = payload.retentionDuration;
        this.policyVersion = payload.policyVersion ?? null;
        this.archivalRequired = payload.archivalRequired;
        this.effectiveFrom = payload.effectiveFrom;
        this.createdAt = payload.createdAt ?? new Date()
    }

    requiresArchival() {
        return this.archivalRequired;
    }
}

export default DocumentRetentionPolicy;