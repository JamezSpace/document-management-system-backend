import type { DocumentPolicyPort } from "../../../../shared/application/port/documentPolicy.port.js";
import type { RetentionMetadata } from "../../../domain/metadata/Retention.metadata.js";
import type { DocumentType } from "../../../../shared/application/types/documentPolicy/documentPolicy.type.js";

class RetentionService {
    constructor(private readonly policyPort: DocumentPolicyPort) {}

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