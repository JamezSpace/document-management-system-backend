import { Type, type Static } from "@fastify/type-provider-typebox";
import { DocumentType } from "../../../shared/application/enum/documentTypes.enum.js";

const createDocumentRetentionPolicySchema = Type.Object({
    documentType: Type.Enum(DocumentType),
    archivalRequired: Type.Boolean(),
    retentionDuration: Type.Number(),
    effectiveFrom: Type.String({format: 'date-time'})
})

type CreateDocumentRetentionPolicyType = Static<typeof createDocumentRetentionPolicySchema>;

export {
    createDocumentRetentionPolicySchema, type CreateDocumentRetentionPolicyType
}