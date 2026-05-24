import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import Document from "../../../domain/entities/document/Document.js";
import { LifecycleActions } from "../../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentAddresseeRepositoryPort } from "../../ports/repos/DocumentAddresseeRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";
import type { LifecycleHistoryRepositoryPort } from "../../ports/repos/LifecycleHistoryRepository.port.js";
import type { ReferenceNumberServicePort } from "../../ports/services/ReferenceNumberService.port.js";
import type { RetentionServicePort } from "../../ports/services/RetentionService.port.js";
import type { DocumentTypeForCreation } from "../../types/doc.type.js";

class DocumentCreationUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentAddresseeRepo: DocumentAddresseeRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly lifecycleHistoryRepo: LifecycleHistoryRepositoryPort,
		private readonly docTypeRepo: DocumentTypeRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly refNumService: ReferenceNumberServicePort,
		private readonly retentionService: RetentionServicePort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		const docTypeId = payload.classification.documentTypeId;

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const retention = await this.retentionService.computeRetention(
					docTypeId,
					new Date(),
				);

				const documentType =
					await this.docTypeRepo.findDocumentTypeById(
						docTypeId,
						transactionInstance,
					);

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
						recipientUnitId: payload.addressee.recipientUnitId,
					});
				}

				const newDocument = new Document({
					id: docId,
					version: null,
					retention,
					referenceNumber,
					...payload,
				});
                
				const savedDoc = await this.documentRepo.save(
					newDocument,
					transactionInstance,
				);

				const savedDocAddressee = await this.documentAddresseeRepo.save(
					{
						documentId: docId,
						recipientUnitId: payload.addressee.recipientUnitId,
						addressedToDesignationId: payload.addressee.addressedToDesignationId,
					},
					transactionInstance,
				);
                
				return {
                    ...savedDoc,
                    addressee: {
                        recipientUnitId: savedDocAddressee.recipientUnitId,
                        addressedToDesignationId: savedDocAddressee.addressedToDesignationId
                    }
                };
			},
		);

		await this.documentEvents.documentInitialized({
			createdBy: result.ownerId,
			documentId: result.id,
		});

		return result;
	}

	// this assumes document version has not been created but document has been created
	async saveDocument(
		document: Document,
		contentDelta: unknown,
		actorId: string,
	) {
		const uuid = this.idGenerator.generate();

		const version = document.save({ contentDelta, uuid }, actorId);

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const savedVersionedDoc = await this.documentVersionRepo.save(
					version,
					transactionInstance,
				);

				const savedDoc = await this.documentRepo.editDocument(document, transactionInstance);

                const savedDocAddressee = await this.documentAddresseeRepo.editDocAddressee({
                    documentId: document.id,
                    editsToMake: {
                        addressedToDesignationId: document.addressee.addressedToDesignationId
                    }
                }, transactionInstance);

				await this.lifecycleHistoryRepo.save({
					id: "CYCLE-HSTORY-" + this.idGenerator.generate(),
					action: LifecycleActions.SAVE,
					actorId,
					documentId: savedVersionedDoc.documentId,
					documentVersionId: savedVersionedDoc.id,
					fromState: null,
					toState: LifecycleState.DRAFT,
					metadata: null,
				}, transactionInstance);

                return {savedDoc, savedVersionedDoc, savedDocAddressee}
			},
		);

		await this.documentEvents.documentVersionCreated({
			documentId: document.id,
			versionedBy: document.ownerId,
		});

		return {
			...result.savedDoc,
			currentVersion: result.savedVersionedDoc,
            addressee: result.savedDocAddressee
		};
	}
}

export default DocumentCreationUseCase;
