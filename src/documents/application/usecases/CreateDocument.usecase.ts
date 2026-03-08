import type { IdGeneratorPort } from "../../../shared/application/port/IdGenerator.port.js";
import Document from "../../domain/Document.js";
import DocumentVersion from "../../domain/DocumentVersion.js";
import { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import type { DocumentEventsPort } from "../ports/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../ports/DocumentRepository.port.js";
import type { DocumentTypeForCreation } from "../types/doc.type.js";

class DocumentCreation {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
	) {}

	async createDocument(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		if (payload.classification.documentType === DocumentType.MEMO) {
			referenceNumber = await this.referenceService.generate();
		}

		const newDocument = new Document({
			id: docId,
			...payload,
			version: null,
		});

		const savedDoc = await this.documentRepo.save(newDocument);

		await this.documentEvents.documentCreated({
			createdBy: savedDoc.ownerId,
			documentId: savedDoc.id,
		});

		return savedDoc;
	}
}

export default DocumentCreation;
