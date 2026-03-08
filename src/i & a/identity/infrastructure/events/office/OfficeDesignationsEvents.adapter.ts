import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../../../shared/application/port/eventbus.port.js";
import type { OfficeDesignationEventsPort } from "../../../application/ports/events/office/OfficeDesignationEvents.port.js";


class OfficeDesignationEventsAdapter implements OfficeDesignationEventsPort {
    constructor(private readonly eventBus: EventBus) {}

    async officeDesignationCreated(payload: {designationId: string;}): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.office.OFFICE_DESIGNATION_CREATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.designationId,
            },
        });
    }

    async officeDesignationUpdated(payload: { designationId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.office.OFFICE_DESIGNATION_UPDATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.designationId,
            },
        });
    }
}

export default OfficeDesignationEventsAdapter;