import { Type, type Static } from "@fastify/type-provider-typebox";
import { CorrespondenceAddressee } from "../../domain/enum/correspondenceAddresee.enum.js";
import { CorrespondenceDirection } from "../../domain/enum/correspondenceDirection.enum.js";
import { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";
import { SensitivityLevel } from "../../domain/enum/sensitivityLevel.enum.js";

const documentIdSchema = Type.Object({
	docId: Type.String(),
});

const docStaffIdSchema = Type.Object({
	staffId: Type.String(),
});

const documentVersionSchema = Type.Object({
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

const documentSchema = Type.Object({
	id: Type.String(),
	ownerId: Type.String(),
	title: Type.String(),
	currentVersion: Type.Object({
        id: Type.String(),
        documentId: Type.String(),
        contentDelta: Type.Unknown(),
        versionNumber: Type.Number(),
        mediaId: Type.Union([Type.Null(), Type.String()]),
        lifecycle: Type.Object({
            currentState: Type.Enum(LifecycleState),
            stateEnteredAt: Type.String({format: 'date-time'}),
            stateEnteredBy: Type.String()
        })
    }),
	referenceNumber: Type.String(),
	classification: Type.Object({
		sensitivity: Type.Enum(SensitivityLevel),
		functionCodeId: Type.String(),
		documentTypeId: Type.String(),
		classifiedBy: Type.String(),
		classifiedAt: Type.String({ format: "date-time" }),
		lastReclassifiedAt: Type.String({ format: "date-time" }),
		lastReclassifiedBy: Type.String(),
	}),
	correspondence: Type.Object({
		originatingUnitId: Type.String(),
		recipientCode: Type.String(),
		subjectCodeId: Type.String(),
		direction: Type.Enum(CorrespondenceDirection),
	}),
	retention: Type.Object({
		policyVersion: Type.Number(),
		retentionScheduleId: Type.String(),
		retentionStartDate: Type.String({ format: "date-time" }),
		disposalEligibilityDate: Type.String({ format: "date-time" }),
		archivalRequired: Type.Boolean(),
	}),
	createdAt: Type.String({ format: "date-time" }),
	updatedAt: Type.String({ format: "date-time" }),
});

const documentSchemaForSave = Type.Object({
	contentDelta: Type.Unknown(),
	document: Type.Any(),
});

type DocumentSchemaType = Static<typeof documentSchema>;
type DocumentIdSchemaType = Static<typeof documentIdSchema>;
type DocStaffIdSchemaType = Static<typeof docStaffIdSchema>;
type DocumentSchemaForSaveType = Static<typeof documentSchemaForSave>;
type DocumentVersionSchemaType = Static<typeof documentVersionSchema>;
type DocumentSchemaTypeForCreation = Static<typeof documentSchemaForCreation>;

export {
	documentSchema,
	documentIdSchema,
	docStaffIdSchema,
	documentSchemaForCreation,
	documentSchemaForSave,
	documentVersionSchema,
	type DocStaffIdSchemaType,
	type DocumentSchemaType,
	type DocumentIdSchemaType,
	type DocumentSchemaForSaveType,
	type DocumentVersionSchemaType,
	type DocumentSchemaTypeForCreation,
};
