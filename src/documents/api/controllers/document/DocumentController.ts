import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type DocumentCreation from "../../../application/usecases/document/CreateDocument.usecase.js";
import type GetAllDocumentsByStaffUseCase from "../../../application/usecases/document/GetAllDocumentsByStaff.usecase.js";
import type GetDocumentByIdUsecase from "../../../application/usecases/document/GetDocById.usecase.js";
import type DocumentSubmission from "../../../application/usecases/document/SubmitDocument.usecase.js";
import Document from "../../../domain/entities/document/Document.js";
import { CorrespondenceAddressee } from "../../../domain/enum/correspondenceAddresee.enum.js";
import type {
	DocumentSchemaType,
	DocumentSchemaTypeForCreation,
} from "../../types/document.type.js";

class DocumentController {
	constructor(
		private readonly createDocumentUseCase: DocumentCreation,
		private readonly getAllDocumentsByStaffUsecase: GetAllDocumentsByStaffUseCase,
		private readonly getDocumentByIdUsecase: GetDocumentByIdUsecase,
		private readonly submitDocUsecase: DocumentSubmission,
	) {}

	structureIncomingPayload(payload: DocumentSchemaTypeForCreation) {
		return {
			title: payload.title,
			createdBy: payload.createdBy,
			action: payload.action,

			correspondence: {
				originatingUnitId: payload.originatingUnitId,
				recipientUnitId: payload.recipientUnitId,
				addressedTo: payload.addressedTo,
				subjectCodeId: payload.subjectCodeId,
				subjectCode: payload.subjectCode,
				direction: payload.direction,
			},
			classification: {
				functionCode: payload.functionCode,
				functionCodeId: payload.functionCodeId,
				sensitivity: payload.sensitivity,
				documentTypeId: payload.documentTypeId,
			},
		};
	}

	async createDocument(payload: DocumentSchemaTypeForCreation) {
		const incomingDocument = this.structureIncomingPayload(payload);

		let recipientCode!: string;

		// correspondence matters
		if (
			incomingDocument.correspondence.addressedTo ===
				CorrespondenceAddressee.UNIT &&
			!incomingDocument.correspondence.recipientUnitId
		) {
			throw new ApplicationError(
				ApplicationErrorEnum.INCOMPLETE_REQUEST,
				{
					message: "Recipient Unit ID not present",
					details:
						"document is addressed to a unit, yet unit addressed to is not present in the request",
				},
			);
		}

		recipientCode =
			incomingDocument.correspondence.addressedTo ===
			CorrespondenceAddressee.EXTERNAL
				? "EXT"
				: incomingDocument.correspondence.recipientUnitId;

		const newDoc = await this.createDocumentUseCase.createDocument({
			ownerId: incomingDocument.createdBy,
			title: incomingDocument.title,
			correspondence: {
				originatingUnitId:
					incomingDocument.correspondence.originatingUnitId,
				recipientCode,
				subjectCodeId: incomingDocument.correspondence.subjectCodeId,
				subjectCode: incomingDocument.correspondence.subjectCode,
				direction: incomingDocument.correspondence.direction,
			},
			action: incomingDocument.action,
			classification: {
				functionCodeId: incomingDocument.classification.functionCodeId,
				functionCode: incomingDocument.classification.functionCode,
				sensitivity: incomingDocument.classification.sensitivity,
				documentTypeId: incomingDocument.classification.documentTypeId,
				classifiedBy: incomingDocument.createdBy,
				classifiedAt: new Date(),
			},
		});

		return newDoc;
	}

	async fetchAllDocsByStaff(staffId: string) {
		const docsByStaff =
			await this.getAllDocumentsByStaffUsecase.getAllDocumentsAuthoredByStaff(
				staffId,
			);

		return docsByStaff;
	}

	async fetchDocById(docId: string) {
		const doc = await this.getDocumentByIdUsecase.getDocById(docId);

		return doc;
	}

	async saveDocument(doc: DocumentSchemaType, contentDelta: unknown) {
		const document = new Document({
			...doc,
			classification: {
				...doc.classification,
				classifiedAt: new Date(doc.classification.classifiedAt),
				lastReclassifiedAt: doc.classification.lastReclassifiedAt
					? new Date(doc.classification.lastReclassifiedAt)
					: null,
			},
			retention: {
				...doc.retention,
				retentionStartDate: new Date(doc.retention.retentionStartDate),
				disposalEligibilityDate: new Date(
					doc.retention.disposalEligibilityDate,
				),
			},
			createdAt: new Date(doc.createdAt),
			updatedAt: new Date(doc.updatedAt),
		});

		const savedDoc = await this.createDocumentUseCase.saveDocument(
			document,
			contentDelta,
		);

		return savedDoc;
	}

	async submitDocument(actorId: string, doc: DocumentSchemaType) {
		const document = {
			...doc,
			currentVersion: {
				lifecycle: {
					...doc.currentVersion.lifecycle,
					stateEnteredAt: new Date(
						doc.currentVersion.lifecycle.stateEnteredAt,
					),
				},
			},
			classification: {
				...doc.classification,
				classifiedAt: new Date(doc.classification.classifiedAt),
				lastReclassifiedAt: new Date(
					doc.classification.lastReclassifiedAt,
				),
			},
			retention: {
				...doc.retention,
				retentionStartDate: new Date(doc.retention.retentionStartDate),
				disposalEligibilityDate: new Date(
					doc.retention.disposalEligibilityDate,
				),
			},
			createdAt: new Date(doc.createdAt),
			updatedAt: new Date(doc.updatedAt),
		};

		const submittedDocument = await this.submitDocUsecase.submitDocument(
			actorId,
			new Document(document),
		);

		return submittedDocument;
	}
}

export default DocumentController;
