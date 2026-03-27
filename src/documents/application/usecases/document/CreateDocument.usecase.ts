import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { MediaServicePort } from "../../../../shared/application/port/services/mediaService.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import Document from "../../../domain/entities/document/Document.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";
import type { ReferenceNumberServicePort } from "../../ports/services/ReferenceNumberService.port.js";
import type { RetentionServicePort } from "../../ports/services/RetentionService.port.js";
import type { DocumentTypeForCreation } from "../../types/doc.type.js";

class DocumentCreation {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly docTypeRepo: DocumentTypeRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly refNumService: ReferenceNumberServicePort,
		private readonly mediaService: MediaServicePort,
		private readonly retentionService: RetentionServicePort,
	) {}

	async createDocument(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		const docTypeId = payload.classification.documentTypeId;

		const retention = await this.retentionService.computeRetention(
			docTypeId,
			new Date(),
		);

		const documentType =
			await this.docTypeRepo.findDocumentTypeById(docTypeId);

		if (!documentType)
			throw new ApplicationError(
				ApplicationErrorEnum.INVALID_CREDENTIALS,
				{
					message: `Document type with id: ${docTypeId} doesnt exist`,
				},
			);

		if (documentType.code === "memo") {
			referenceNumber = await this.refNumService.generate({
				year: new Date().getFullYear(),
				subjectCode: payload.correspondence.subjectCode,
				functionCode: payload.classification.functionCode,
				originUnitId: payload.correspondence.originatingUnitId,
				recipientCode: payload.correspondence.recipientCode,
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
	async saveDocument(payload: Document, contentDelta: unknown) {
		const uuid = this.idGenerator.generate();

		// const { mediaId } = await this.mediaService.uploadDoc(
		// 	file,
		// 	payload.ownerId,
		// );
        
		const firstVersion = payload.addVersion(
			{ contentDelta, uuid },
			payload.ownerId,
		);

		const savedVersionedDoc =
			await this.documentVersionRepo.save(firstVersion);

		const savedDoc = await this.documentRepo.editDocument(payload);

		await this.documentEvents.documentVersionCreated({
			documentId: payload.id,
			versionedBy: payload.ownerId,
		});

		return savedDoc;
	}
}

export default DocumentCreation;
