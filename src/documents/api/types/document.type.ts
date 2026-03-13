import { Type, type Static } from "@fastify/type-provider-typebox";
import { CorrespondenceAddressee } from "../../domain/enum/correspondenceAddresee.enum.js";
import { DocumentType } from "../../domain/enum/documentTypes.enum.js";
import { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import { RecipientSector } from "../../domain/enum/recipientSector.enum.js";
import { SensitivityLevel } from "../../domain/enum/sensitivityLevel.enum.js";

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
	title: Type.String(),
	createdBy: Type.String(),
    action: Type.Enum(LifecycleActions),
    
    correspondence: Type.Object({
        originatingUnitId: Type.String(),
        recipientUnitId: Type.String(),
        addressedTo: Type.Enum(CorrespondenceAddressee),
        recipientName: Type.String(),
        recipientSector: Type.Enum(RecipientSector),
        subjectCode: Type.String(),
        functionCode: Type.String(),
    }),
    classification: Type.Object({
        businessFunctionId: Type.String(),
        sensitivity: Type.Enum(SensitivityLevel),
        documentType: Type.Enum(DocumentType)
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

