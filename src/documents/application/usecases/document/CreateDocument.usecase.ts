import type { IdGeneratorPort } from "../../../../shared/application/port/IdGenerator.port.js";
import type { MediaServicePort } from "../../../../shared/application/port/services/mediaService.port.js";
import Document from "../../../domain/Document.js";
import DocumentVersion from "../../../domain/DocumentVersion.js";
import { DocumentType } from "../../../domain/enum/documentTypes.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type RetentionService from "../../../infrastructure/services/RetentionService.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";
import type { ReferenceNumberServicePort } from "../../ports/services/ReferenceNumberService.port.js";
import type { RetentionServicePort } from "../../ports/services/RetentionService.port.js";
import type { DocumentTypeForCreation } from "../../types/doc.type.js";

class DocumentCreation {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly refNumService: ReferenceNumberServicePort,
		private readonly mediaService: MediaServicePort,
		private readonly retentionService: RetentionServicePort,
	) {}

	async createDocument(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		const retention = await this.retentionService.computeRetention(
			payload.classification.documentType,
			new Date(),
		);

		if (payload.classification.documentType === DocumentType.MEMO) {
			referenceNumber = await this.refNumService.generate({
                year: new Date().getFullYear(),
                subjectCode: payload.correspondence.subjectCode,
                functionCode: payload.classification.functionCode,
                originUnitId: payload.correspondence.originatingUnitId,
                recipientCode: payload.correspondence.recipientCode
            });
		}

		const newDocument = new Document({
			id: docId,
			version: null,
			retention,
            referenceNumber,
			...payload,
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
        const uuid = this.idGenerator.generate();
		const docVersionId = "DOC-VERS-" + uuid;
		const { mediaId } = await this.mediaService.uploadDoc(
			file,
			payload.ownerId,
		);

		const firstVersion = new DocumentVersion({
            id: docVersionId,
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
