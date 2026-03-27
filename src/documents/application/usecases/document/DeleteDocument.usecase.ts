import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class DeleteDocumentUseCase {
	constructor(
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
	) {}

	async deleteDocument(payload: { documentId: string; deletedBy: string }) {
		const doc = await this.documentRepo.findDocumentById(payload.documentId);

		if (!doc) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${payload.documentId} doesn't exist.`,
				details: { documentId: payload.documentId },
			});
		}

		const version = doc.getCurrentVersion();

		if (version && version.getState() !== LifecycleState.DRAFT) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only draft documents can be deleted.",
				details: {
					documentId: payload.documentId,
					currentState: version.getState(),
				},
			});
		}

		await this.documentRepo.hardDeleteDocument(payload.documentId);

		await this.documentEvents.documentDeleted({
			documentId: payload.documentId,
			deletedBy: payload.deletedBy,
		});
	}
}

export default DeleteDocumentUseCase;
