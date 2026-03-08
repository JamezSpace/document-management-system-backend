import type { IdGeneratorPort } from "../../../shared/application/port/IdGenerator.port.js";
import type { MediaServicePort } from "../../../shared/application/port/services/mediaService.port.js";
import Document from "../../domain/Document.js";
import DocumentVersion from "../../domain/DocumentVersion.js";
import { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";
import type { DocumentVersionRepositoryPort } from "../ports/DocumentVersion.port.js";
import type { ReferenceNumberServicePort } from "../ports/services/ReferenceNumberService.port.js";
import type RetentionService from "../ports/services/RetentionService.port.js";
import type { DocumentTypeForCreation } from "../types/doc.type.js";

class DocumentCreation {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly refNumService: ReferenceNumberServicePort,
		private readonly mediaService: MediaServicePort,
		private readonly retentionService: RetentionService,
	) {}

	async createDocument(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		const retention = await this.retentionService.computeRetention(
			payload.type,
			new Date(),
		);

		if (payload.classification.documentType === DocumentType.MEMO) {
			const refDetails = await this.refNumService.generate();

			referenceNumber = refDetails.refNum;
		}

		const newDocument = new Document({
			id: docId,
			...payload,
			version: null,
			retention,
		});

		const savedDoc = await this.documentRepo.save(newDocument);

		await this.documentEvents.documentInitialized({
			createdBy: savedDoc.ownerId,
			documentId: savedDoc.id,
		});

		return savedDoc;
	}

	// this assumes document version has not been created but document has been created
	async saveDocument(payload: Document, file: Buffer) {
		const { mediaId } = await this.mediaService.upload(
			file,
			payload.ownerId,
		);

		const firstVersion = new DocumentVersion({
			documentId: payload.id,
			lifecycle: {
				currentState: LifecycleState.DRAFT,
				stateEnteredAt: new Date(),
				stateEnteredBy: payload.ownerId,
			},
			mediaId,
			versionNumber: 1,
		});

		const savedVersionedDoc =
			await this.documentVersionRepo.save(firstVersion);

		await this.documentEvents.documentVersionCreated({
			documentId: payload.id,
			versionedBy: payload.ownerId,
		});

		return savedVersionedDoc;
	}
}

export default DocumentCreation;
