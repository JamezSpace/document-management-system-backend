import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type DocumentCreation from "../../../application/usecases/document/CreateDocument.usecase.js";
import { CorrespondenceAddressee } from "../../../domain/enum/correspondenceAddresee.enum.js";
import type { DocumentSchemaTypeForCreation } from "../../types/document.type.js";

class DocumentController {
	constructor(private readonly createDocumentUseCase: DocumentCreation) {}

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
                direction: payload.direction
            },
            classification: {
                functionCode: payload.functionCode,
                functionCodeId: payload.functionCodeId,
                sensitivity: payload.sensitivity,
                documentTypeId: payload.documentTypeId
            }
        }
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
                originatingUnitId: incomingDocument.correspondence.originatingUnitId,
                recipientCode,
                subjectCodeId: incomingDocument.correspondence.subjectCodeId,
                subjectCode: incomingDocument.correspondence.subjectCode,
                direction: incomingDocument.correspondence.direction
            },
            action: incomingDocument.action,
            classification: {
                functionCodeId: incomingDocument.classification.functionCodeId,
                functionCode: incomingDocument.classification.functionCode,
                sensitivity: incomingDocument.classification.sensitivity,
                documentTypeId: incomingDocument.classification.documentTypeId,
                classifiedBy: incomingDocument.createdBy,
                classifiedAt: new Date(),
            }
		});

		return newDoc;
	}
}

export default DocumentController;
