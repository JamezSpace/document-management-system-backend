import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type DocumentCreation from "../../../application/usecases/document/CreateDocument.usecase.js";
import { CorrespondenceAddressee } from "../../../domain/enum/correspondenceAddresee.enum.js";
import type { DocumentSchemaTypeForCreation } from "../../types/document.type.js";

class DocumentController {
	constructor(private readonly createDocumentUseCase: DocumentCreation) {}

	async createDocument(payload: DocumentSchemaTypeForCreation) {
		let recipientCode!: string;

		// correspondence matters
		if (
			payload.correspondence.addressedTo ===
				CorrespondenceAddressee.UNIT &&
			!payload.correspondence.recipientUnitId
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
			payload.correspondence.addressedTo ===
			CorrespondenceAddressee.EXTERNAL
				? "EXT"
				: payload.correspondence.recipientUnitId;

		const newDoc = await this.createDocumentUseCase.createDocument({
			ownerId: payload.createdBy,
			title: payload.title,
			correspondence: {
                originatingUnitId: payload.correspondence.originatingUnitId,
                recipientCode,
                subjectCode: payload.correspondence.subjectCode
            },
            action: payload.action,
            classification: {
                businessFunctionId: payload.classification.businessFunctionId,
                sensitivity: payload.classification.sensitivity,
                documentType: payload.classification.documentType,
                classifiedBy: payload.createdBy,
                classifiedAt: new Date(),
            }
		});

		return newDoc;
	}
}

export default DocumentController;
