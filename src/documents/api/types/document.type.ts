import { Type, type Static } from "@fastify/type-provider-typebox";
import { CorrespondenceAddressee } from "../../domain/enum/correspondenceAddresee.enum.js";
import { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import { SensitivityLevel } from "../../domain/enum/sensitivityLevel.enum.js";
import { CorrespondenceDirection } from "../../domain/enum/correspondenceDirection.enum.js";

const documentIdSchema = Type.Object({
    docId: Type.String()
})

const docStaffIdSchema = Type.Object({
    staffId: Type.String()
})

const documentSchema = Type.Object({
	ownerId: Type.String(),
	title: Type.String(),
	documentTypeId: Type.String(),
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

	// correspondence
	originatingUnitId: Type.String(),
	recipientUnitId: Type.String(),
	addressedTo: Type.Enum(CorrespondenceAddressee),
	subjectCodeId: Type.String(),
	subjectCode: Type.String(),
    direction: Type.Enum(CorrespondenceDirection),

	// classification
	functionCode: Type.String(),
	functionCodeId: Type.String(),
	sensitivity: Type.Enum(SensitivityLevel),
	documentTypeId: Type.String(),
});

type DocumentSchemaType = Static<typeof documentSchema>;
type DocumentSchemaTypeForCreation = Static<typeof documentSchemaForCreation>;
type DocumentIdSchemaType = Static<typeof documentIdSchema>;
type DocStaffIdSchemaType = Static<typeof docStaffIdSchema>;

export {
    documentIdSchema,
    docStaffIdSchema,
	documentSchema,
	documentSchemaForCreation,
	type DocumentSchemaType,
	type DocumentSchemaTypeForCreation,
    type DocumentIdSchemaType,
    type DocStaffIdSchemaType
};
