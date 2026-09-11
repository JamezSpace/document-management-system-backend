import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import NexusError from "../../../../shared/errors/NexusError.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Document from "../../../domain/entities/document/Document.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type {
	DocumentAttachmentRepositoryPort,
	UploadedMediaForAttachment,
} from "../../ports/repos/DocumentAttachmentRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";
import OpaqueCursor from "../../services/OpaqueCursor.service.js";

const MAX_UPLOADED_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MIME_TYPES_BY_EXTENSION: Readonly<Record<string, readonly string[]>> = {
	pdf: ["application/pdf"],
	doc: ["application/msword"],
	docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
	xls: ["application/vnd.ms-excel"],
	xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
	ppt: ["application/vnd.ms-powerpoint"],
	pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
	jpg: ["image/jpeg"],
	jpeg: ["image/jpeg"],
	png: ["image/png"],
	tif: ["image/tiff"],
	tiff: ["image/tiff"],
	txt: ["text/plain"],
};

class ManageDocumentAttachmentUseCase {
	constructor(
		private readonly documents: DocumentRepositoryPort,
		private readonly attachments: DocumentAttachmentRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
		private readonly transactionManager: TransactionManager,
		private readonly ids: IdGeneratorPort,
	) {}

	async candidates(
		parentDocumentId: string,
		searchTerm: string,
		actorStaffId: string,
		requestedLimit = 25,
		cursor?: string,
	) {
		const parent = await this.requireDocument(parentDocumentId);
		await this.governance.authorize(parent, actorStaffId, "attach");
		this.ensureAttachmentState(parent.getCurrentVersion()?.getState() ?? null);

		const term = searchTerm.trim();
		const limit = Math.min(Math.max(requestedLimit, 1), 100);
		if (!term) return { items: [], pageInfo: { limit, hasMore: false, nextCursor: null } };

		const parsed = OpaqueCursor.decode(cursor, ["createdAt", "id"]);
		let databaseCursor = parsed
			? { createdAt: new Date(parsed.createdAt!), id: parsed.id! }
			: null;
		if (databaseCursor && Number.isNaN(databaseCursor.createdAt.getTime())) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Attachment candidate cursor date is invalid",
			});
		}

		const visible: Document[] = [];
		while (visible.length <= limit) {
			const candidates = await this.documents.discover(term, 100, databaseCursor);
			if (candidates.length === 0) break;
			const authorized: Document[] = [];
			for (const candidate of candidates) {
				databaseCursor = { createdAt: candidate.createdAt, id: candidate.id };
				if (candidate.id === parentDocumentId || !candidate.getCurrentVersion()) continue;
				try {
					await this.governance.authorize(candidate, actorStaffId, "discover");
					await this.governance.authorize(candidate, actorStaffId, "view");
					authorized.push(candidate);
				} catch (error) {
					if (!this.isHiddenGovernanceDenial(error)) throw error;
				}
			}

			const eligibleIds = await this.attachments.filterEligibleInternalSources(
				parentDocumentId,
				authorized.map((candidate) => candidate.id),
			);
			for (const candidate of authorized) {
				if (eligibleIds.has(candidate.id)) visible.push(candidate);
				if (visible.length > limit) break;
			}
			if (candidates.length < 100 || visible.length > limit) break;
		}

		const page = visible.slice(0, limit);
		const last = page.at(-1);
		return {
			items: page.map((candidate) => ({
				documentId: candidate.id,
				title: candidate.title,
				referenceNumber: candidate.referenceNumber,
				sensitivity: candidate.classification.sensitivity,
				version: {
					id: candidate.getCurrentVersion()!.id,
					number: candidate.getCurrentVersion()!.versionNumber,
				},
				createdAt: candidate.createdAt,
			})),
			pageInfo: {
				limit,
				hasMore: visible.length > limit,
				nextCursor: visible.length > limit && last
					? OpaqueCursor.encode({ createdAt: last.createdAt.toISOString(), id: last.id })
					: null,
			},
		};
	}

	async attachInternal(payload: {
		parentDocumentId: string;
		sourceDocumentId: string;
		sourceVersionId: string;
		actorStaffId: string;
		expectedRevision: number;
	}) {
		if (payload.parentDocumentId === payload.sourceDocumentId) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: "A document cannot be attached to itself",
			});
		}
		const documentRevision = await this.transactionManager.execute(async (tx) => {
			const locked = await this.documents.lockAttachmentDocuments(
				payload.parentDocumentId,
				payload.sourceDocumentId,
				payload.expectedRevision,
				tx,
			);
			if (!locked) this.throwStaleAttachmentDecision(payload.parentDocumentId, payload.expectedRevision);

			const parent = await this.requireDocument(payload.parentDocumentId, tx);
			const source = await this.requireDocument(payload.sourceDocumentId, tx);
			await this.governance.authorize(parent, payload.actorStaffId, "attach");
			await this.governance.authorize(source, payload.actorStaffId, "discover");
			await this.governance.authorize(source, payload.actorStaffId, "view");
			this.ensureAttachmentState(parent.getCurrentVersion()?.getState() ?? null);

			if (!await this.attachments.sourceVersionExists(
				payload.sourceDocumentId,
				payload.sourceVersionId,
				tx,
			)) {
				throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
					message: "The selected source document version was not found",
				});
			}
			if (await this.attachments.wouldCreateCycle(
				payload.parentDocumentId,
				payload.sourceDocumentId,
				tx,
			)) {
				throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
					message: "The internal attachment would create a circular document relationship",
				});
			}

			await this.attachments.save({
				id: `DOC-ATTACH-${this.ids.generate()}`,
				parentDocumentId: payload.parentDocumentId,
				parentDocumentVersionId: parent.getCurrentVersion()?.id ?? null,
				sourceType: "internal_document",
				sourceDocumentId: payload.sourceDocumentId,
				sourceDocumentVersionId: payload.sourceVersionId,
				attachedBy: payload.actorStaffId,
			}, tx);
			return this.incrementRevision(payload.parentDocumentId, payload.expectedRevision, tx);
		});

		return {
			attachments: await this.attachments.listByDocument(payload.parentDocumentId),
			documentRevision,
		};
	}

	async attachUploaded(payload: {
		parentDocumentId: string;
		mediaId: string;
		actorStaffId: string;
		expectedRevision: number;
	}) {
		const documentRevision = await this.transactionManager.execute(async (tx) => {
			if (!await this.documents.lockRevision(payload.parentDocumentId, payload.expectedRevision, tx)) {
				this.throwStaleAttachmentDecision(payload.parentDocumentId, payload.expectedRevision);
			}
			const parent = await this.requireDocument(payload.parentDocumentId, tx);
			await this.governance.authorize(parent, payload.actorStaffId, "attach");
			this.ensureAttachmentState(parent.getCurrentVersion()?.getState() ?? null);

			const media = await this.attachments.findUploadedMedia(payload.mediaId, tx);
			this.validateUploadedMedia(media, payload.actorStaffId, payload.mediaId);
			await this.attachments.save({
				id: `DOC-ATTACH-${this.ids.generate()}`,
				parentDocumentId: payload.parentDocumentId,
				parentDocumentVersionId: parent.getCurrentVersion()?.id ?? null,
				sourceType: "uploaded_file",
				mediaId: payload.mediaId,
				attachedBy: payload.actorStaffId,
			}, tx);
			return this.incrementRevision(payload.parentDocumentId, payload.expectedRevision, tx);
		});

		return {
			attachments: await this.attachments.listByDocument(payload.parentDocumentId),
			documentRevision,
		};
	}

	attach(payload: {
		documentId: string;
		mediaId: string;
		actorStaffId: string;
		expectedRevision: number;
	}) {
		return this.attachUploaded({
			parentDocumentId: payload.documentId,
			mediaId: payload.mediaId,
			actorStaffId: payload.actorStaffId,
			expectedRevision: payload.expectedRevision,
		});
	}

	async list(documentId: string, actorStaffId: string) {
		const document = await this.requireDocument(documentId);
		await this.governance.authorize(document, actorStaffId, "view");
		return this.attachments.listByDocument(documentId);
	}

	async remove(documentId: string, attachmentId: string, actorStaffId: string, expectedRevision: number) {
		return this.transactionManager.execute(async (tx) => {
			if (!await this.documents.lockRevision(documentId, expectedRevision, tx)) {
				this.throwStaleAttachmentDecision(documentId, expectedRevision);
			}
			const document = await this.requireDocument(documentId, tx);
			await this.governance.authorize(document, actorStaffId, "attach");
			if (document.ownerId !== actorStaffId) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "Only the document author may remove an attachment",
				});
			}
			const removed = await this.attachments.remove(documentId, attachmentId, tx);
			if (!removed) return false;
			const documentRevision = await this.incrementRevision(documentId, expectedRevision, tx);
			return { removed: true, documentRevision };
		});
	}

	private async requireDocument(documentId: string, tx?: TransactionContext) {
		const document = await this.documents.findDocumentById(documentId, tx);
		if (!document) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${documentId} doesn't exist.`,
			});
		}
		return document;
	}

	private async incrementRevision(documentId: string, expectedRevision: number, tx: TransactionContext) {
		const revision = await this.documents.incrementRevision(documentId, expectedRevision, tx);
		if (!revision) this.throwStaleAttachmentDecision(documentId, expectedRevision);
		return revision;
	}

	private throwStaleAttachmentDecision(documentId: string, expectedRevision: number): never {
		throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
			message: "Document revision changed before the attachment operation completed",
			details: { documentId, expectedRevision },
		});
	}

	private validateUploadedMedia(
		media: UploadedMediaForAttachment | null,
		actorStaffId: string,
		mediaId: string,
	): asserts media is UploadedMediaForAttachment {
		if (!media || !media.isActive || media.uploadedByType !== "staff" || media.uploadedBy !== actorStaffId) {
			throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, {
				message: "Active media owned by the requester was not found",
				details: { mediaId },
			});
		}
		if (media.virusScanStatus !== "clean") {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: "The uploaded file cannot be attached until virus scanning reports it as clean",
				details: { mediaId, virusScanStatus: media.virusScanStatus },
			});
		}
		const extension = media.format.trim().toLowerCase().replace(/^\./, "");
		const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[extension];
		if (!allowedMimeTypes?.includes(media.mimeType.toLowerCase())) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "The uploaded file type is not allowed or its MIME type does not match its extension",
				details: { mediaId, format: media.format, mimeType: media.mimeType },
			});
		}
		if (media.sizeBytes <= 0 || media.sizeBytes > MAX_UPLOADED_ATTACHMENT_BYTES) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "The uploaded file exceeds the attachment size limit",
				details: { mediaId, maximumBytes: MAX_UPLOADED_ATTACHMENT_BYTES },
			});
		}
		if (!/^[0-9a-f]{64}$/i.test(media.checksum)) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "The uploaded file does not have a valid SHA-256 checksum",
				details: { mediaId },
			});
		}
	}

	private ensureAttachmentState(state: LifecycleState | null) {
		if (![null, LifecycleState.DRAFT, LifecycleState.IN_REVIEW].includes(state)) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Attachments are closed for the document's current lifecycle state",
			});
		}
	}

	private isHiddenGovernanceDenial(error: unknown) {
		return error instanceof NexusError && [
			"not_allowed",
			"governance_grant_expired",
			"governance_grant_revoked",
		].includes(error.errorCode);
	}
}

export default ManageDocumentAttachmentUseCase;
