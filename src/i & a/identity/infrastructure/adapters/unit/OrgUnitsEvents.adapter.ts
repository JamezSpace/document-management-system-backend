import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../../../shared/application/port/eventbus.port.js";
import type { OrgUnitEventsPort } from "../../../application/ports/events/OrgUnitEvents.port.js";

class OrgUnitsEventsAdapter implements OrgUnitEventsPort {
    constructor(private readonly eventBus: EventBus) {
        }
    async unitCreated(payload: { unitId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.ORG_UNIT_CREATED,
            occurredAt: new Date(),
            payload: {
                unitId: payload.unitId,
            },
        });
    }
}

export default OrgUnitsEventsAdapter;