import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../shared/application/port/eventbus.port.js";
import type { DocumentEventsPort } from "../../application/ports/DocumentEvents.port.js";

class DocumentEventsAdapter implements DocumentEventsPort {
	constructor(private readonly eventBus: EventBus) {}

	async documentCancelled(payload: {
		documentId: string;
		cancelledBy: string;
		reason: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_CANCELLED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentActivated(payload: {
		documentId: string;
		activatedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_ACTIVATED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentDeclared(payload: {
		documentId: string;
		declaredBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_DECLARED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentDeleted(payload: {
		documentId: string;
		deletedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_DELETED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentDisposed(payload: {
		documentId: string;
		disposedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_DISPOSED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentSubmitted(payload: {
		documentId: string;
		submittedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_SUBMITTED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentCreated(payload: {
		documentId: string;
		createdBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_CREATED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentApproved(payload: {
		documentId: string;
		approvedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_APPROVED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentRejected(payload: {
		documentId: string;
		rejectedBy: string;
		reason: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_REJECTED,
			occurredAt: new Date(),
			payload
		});
	}

	async documentArchived(payload: {
		documentId: string;
		archivedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.DOCUMENT_ARCHIVED,
			occurredAt: new Date(),
			payload
		});
	}
}

export default DocumentEventsAdapter;
