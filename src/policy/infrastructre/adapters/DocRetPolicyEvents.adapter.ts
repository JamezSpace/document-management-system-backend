import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBus } from "../../../shared/application/port/eventbus.port.js";
import type { DocumentRetentionPolicyEventsPort } from "../../application/port/events/DocRetPolicyEvents.port.js";

class DocumentRetentionPolicyEventsAdapter implements DocumentRetentionPolicyEventsPort {
    constructor(private readonly eventBus: EventBus) {}

    async documentRetentionPolicyCreated(payload: { policyId: string; actorId: string; }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.policy.DOC_RET_POLICY_CREATED,
            occurredAt: new Date(),
            payload
        })
    }
}

export default DocumentRetentionPolicyEventsAdapter;