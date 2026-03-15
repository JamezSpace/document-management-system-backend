import type { DocumentType } from "../../../shared/application/enum/documentTypes.enum.js";
import type { IdGeneratorPort } from "../../../shared/application/port/IdGenerator.port.js";
import DocumentRetentionPolicy from "../../domain/DocumentRetentionPolicy.js";
import type { DocumentRetentionPolicyEventsPort } from "../port/events/DocRetPolicyEvents.port.js";
import type { DocumentRetentionPolicyRepositoryPort } from "../port/repo/DocRetPolicyRepo.port.js";

class CreateDocumentRetentionPolicyUsecase {
    constructor(
        private readonly idGeneratorPort: IdGeneratorPort,
        private readonly retentionPolicyRepo: DocumentRetentionPolicyRepositoryPort,
        private readonly retentionPolicyEvents: DocumentRetentionPolicyEventsPort,
    ) {}

    async createDocumentRetentionPolicy(
        actorId: string,
        payload: {
            documentType: DocumentType;
            archivalRequired: boolean;
            retentionDuration: number;
            effectiveFrom: Date;
        },
    ) {
        const policyId = `DOC-RET-POL-${this.idGeneratorPort.generate()}`;

        const retentionPolicy = new DocumentRetentionPolicy({
            id: policyId,
            documentType: payload.documentType,
            archivalRequired: payload.archivalRequired,
            retentionDuration: payload.retentionDuration,
            effectiveFrom: payload.effectiveFrom,
        });

        const savedPolicy = await this.retentionPolicyRepo.save(retentionPolicy);

        if (savedPolicy) {
            await this.retentionPolicyEvents.documentRetentionPolicyCreated({
                policyId,
                actorId,
            });
        }

        return savedPolicy;
    }
}

export default CreateDocumentRetentionPolicyUsecase;
