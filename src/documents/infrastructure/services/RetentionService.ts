import type { DocumentRetentionPolicyPort } from "../../../shared/application/port/DocumentRetentionPolicy.port.js";
import type { DocumentType } from "../../../shared/application/types/DocumentRetentionPolicy/DocumentRetentionPolicy.type.js";
import type { RetentionServicePort } from "../../application/ports/services/RetentionService.port.js";
import type { RetentionMetadata } from "../../domain/metadata/Retention.metadata.js";

class RetentionService implements RetentionServicePort {
    constructor(private readonly policyPort: DocumentRetentionPolicyPort) {}

    async computeRetention(
        documentType: DocumentType,
        retentionStartDate: Date
    ): Promise<RetentionMetadata> {

        const policy = await this.policyPort.getRetentionData(documentType);

        const disposalEligibilityDate = new Date(retentionStartDate);
        disposalEligibilityDate.setFullYear(
            disposalEligibilityDate.getFullYear() + policy.duration
        );

        return {
            policyVersion: policy.policyVersion,
            retentionScheduleId: documentType,
            retentionStartDate,
            disposalEligibilityDate,
            archivalRequired: policy.archivalRequired
        };
    }
}

export default RetentionService;