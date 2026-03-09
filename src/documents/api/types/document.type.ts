import { Type, type Static } from "@fastify/type-provider-typebox";
import { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import { CorrespondenceVolume } from "../../domain/enum/correspondenceVolumes.enum.js";
import { CorrespondenceAddressee } from "../../domain/enum/correspondenceAddresee.enum.js";
import { RecipientSector } from "../../domain/enum/recipientSector.enum.js";

const documentSchema = Type.Object({
    ownerId: Type.String(),
    title: Type.String(),
    documentType: Type.Enum(DocumentType),
    lifecycle: Type.Object({
        currentState: Type.Union([Type.Enum(LifecycleState), Type.Null()]),
        enteredAt: Type.String({
            format: "date-time",
        }),
        enteredBy: Type.String(),
    }),
});

const documentSchemaForCreation = Type.Object({
	createdBy: Type.String(),
	title: Type.String(),
    
	documentType: Type.Enum(DocumentType),
    correspondence: Type.Object({
        originatingUnitId: Type.String(),
        recipientUnitId: Type.String(),
        addressedTo: Type.Enum(CorrespondenceAddressee),
        recipientName: Type.String(),
        recipientSector: Type.Enum(RecipientSector),
    })
});

type DocumentSchemaType = Static<typeof documentSchema>;
type DocumentSchemaTypeForCreation = Static<typeof documentSchemaForCreation>;

export {
    documentSchema,
    documentSchemaForCreation,
    type DocumentSchemaType,
    type DocumentSchemaTypeForCreation
};

