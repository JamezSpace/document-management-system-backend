import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../../../shared/application/port/eventbus.port.js";
import type { OfficeEventsPort } from "../../../application/ports/events/office/OfficeEvents.port.js";

class OfficeEventsAdapter implements OfficeEventsPort {
    constructor(private readonly eventBus: EventBus) {
        }

    async officeCreated(payload: { officeId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.OFFICE_CREATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.officeId,
            },
        });
    }

    async officeUpdated(payload: { officeId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.OFFICE_UPDATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.officeId,
            },
        });
    }
}

export default OfficeEventsAdapter;