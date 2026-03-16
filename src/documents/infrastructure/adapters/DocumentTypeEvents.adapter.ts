import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../shared/application/port/eventbus.port.js";
import type { DocumentTypeEventsPort } from "../../application/ports/events/DocumentTypeEvents.port.js";

class DocumentTypeEventsAdapter implements DocumentTypeEventsPort {
    constructor(private readonly eventBus: EventBus) {}

    async documentTypeCreated(payload: { docType: { id: string; name: string; }; actorId: string; }): Promise<void> {
        await this.eventBus.emit({
			eventName:
				GlobalEventTypes.document.document_type.DOC_TYPE_CREATED,
			occurredAt: new Date(),
			payload,
		});
    }
}

export default DocumentTypeEventsAdapter;