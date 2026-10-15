import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

type DocumentSignatureStatus = "signed" | "revoked" | "invalidated";

interface SignatureMediaSnapshot {
	id: string;
	objectKey: string;
	format: string;
	mimeType: string;
	checksum: string;
}

interface ActiveStaffSignatureMedia extends SignatureMediaSnapshot {
	signerName: string;
	signerDesignation: string | null;
}

interface DocumentSignatureRecord {
	id: string;
	documentId: string;
	documentVersionId: string | null;
	signedRevision: number | null;
	contentSha256: string | null;
	signedBy: string;
	signerName: string;
	signerDesignation: string | null;
	signedAt: Date;
	signatureMedia: SignatureMediaSnapshot | null;
	revokedBy: string | null;
	revokedAt: Date | null;
	revocationReason: string | null;
	invalidatedAt: Date | null;
	invalidationReason: string | null;
	status: DocumentSignatureStatus;
}

interface RecordUnitHeadSignaturePayload {
	id: string;
	documentId: string;
	documentVersionId: string;
	signedRevision: number;
	contentSha256: string;
	signatureMediaId: string;
	signerName: string;
	signerDesignation: string | null;
	signedBy: string;
	signedAt: Date;
}

interface DocumentSignatureRepositoryPort {
	findActiveStaffSignatureMedia(staffId: string, tx?: TransactionContext): Promise<ActiveStaffSignatureMedia | null>;
	findEffectiveByDocument(documentId: string, documentVersionId: string, tx?: TransactionContext): Promise<DocumentSignatureRecord | null>;
	findById(signatureId: string, tx?: TransactionContext): Promise<DocumentSignatureRecord | null>;
	listByDocument(documentId: string): Promise<DocumentSignatureRecord[]>;
	invalidateOutdated(documentId: string, documentVersionId: string, contentSha256: string, invalidatedAt: Date, tx: TransactionContext): Promise<void>;
	recordUnitHeadSignature(payload: RecordUnitHeadSignaturePayload, tx: TransactionContext): Promise<DocumentSignatureRecord>;
	revoke(signatureId: string, documentId: string, revokedBy: string, revokedAt: Date, reason: string, tx: TransactionContext): Promise<boolean>;
}

export type {
	ActiveStaffSignatureMedia,
	DocumentSignatureRecord,
	DocumentSignatureRepositoryPort,
	DocumentSignatureStatus,
	RecordUnitHeadSignaturePayload,
	SignatureMediaSnapshot,
};
