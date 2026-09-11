import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

type AttachmentSourceType = "internal_document" | "uploaded_file";

interface SaveDocumentAttachmentPayload {
	id: string;
	parentDocumentId: string;
	parentDocumentVersionId: string | null;
	sourceType: AttachmentSourceType;
	sourceDocumentId?: string | null;
	sourceDocumentVersionId?: string | null;
	mediaId?: string | null;
	attachedBy: string;
}

interface UploadedMediaForAttachment {
	id: string;
	format: string;
	mimeType: string;
	sizeBytes: number;
	checksum: string;
	uploadedBy: string;
	uploadedByType: "staff" | "onboarding_session" | "system";
	isActive: boolean;
	virusScanStatus: "pending" | "clean" | "infected" | "failed";
}

interface DocumentAttachmentRecord {
	id: string;
	parentDocumentId: string;
	parentDocumentVersionId: string | null;
	sourceType: AttachmentSourceType;
	sourceDocumentId: string | null;
	sourceDocumentVersionId: string | null;
	sourceDocumentTitle: string | null;
	sourceDocumentReferenceNumber: string | null;
	sourceDocumentVersionNumber: number | null;
	mediaId: string | null;
	mimeType: string | null;
	sizeBytes: number | null;
	checksum: string | null;
	attachedBy: string;
	attachedAt: Date;
}

interface DocumentAttachmentRepositoryPort {
	save(payload: SaveDocumentAttachmentPayload, tx: TransactionContext): Promise<void>;
	listByDocument(documentId: string): Promise<DocumentAttachmentRecord[]>;
	remove(documentId: string, attachmentId: string, tx: TransactionContext): Promise<boolean>;
	findUploadedMedia(mediaId: string, tx: TransactionContext): Promise<UploadedMediaForAttachment | null>;
	sourceVersionExists(documentId: string, versionId: string, tx: TransactionContext): Promise<boolean>;
	wouldCreateCycle(parentDocumentId: string, sourceDocumentId: string, tx: TransactionContext): Promise<boolean>;
	filterEligibleInternalSources(parentDocumentId: string, candidateIds: string[]): Promise<Set<string>>;
}

export type {
	AttachmentSourceType,
	DocumentAttachmentRecord,
	DocumentAttachmentRepositoryPort,
	SaveDocumentAttachmentPayload,
	UploadedMediaForAttachment,
};
