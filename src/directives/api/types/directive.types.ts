import { Type, type Static } from "@sinclair/typebox";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { DirectiveRevisionInput, DirectiveTarget } from "../../domain/directive.models.js";

const idSchema = Type.String({ minLength: 1, maxLength: 120 });
const nullableText = Type.Union([Type.String({ minLength: 1, maxLength: 5000 }), Type.Null()]);

const staffTargetSchema = Type.Object({
	type: Type.Literal("staff"),
	staffId: idSchema,
}, { additionalProperties: false });
const unitTargetSchema = Type.Object({
	type: Type.Literal("unit"),
	unitId: idSchema,
}, { additionalProperties: false });
const officeTargetSchema = Type.Object({
	type: Type.Literal("office"),
	officeId: idSchema,
}, { additionalProperties: false });
const roleTargetSchema = Type.Object({
	type: Type.Literal("role"),
	roleId: idSchema,
	scopeType: Type.Union([Type.Literal("organization"), Type.Literal("unit"), Type.Literal("office")]),
	scopeUnitId: Type.Optional(Type.Union([idSchema, Type.Null()])),
	scopeOfficeId: Type.Optional(Type.Union([idSchema, Type.Null()])),
}, { additionalProperties: false });

const directiveTargetSchema = Type.Union([
	staffTargetSchema,
	unitTargetSchema,
	officeTargetSchema,
	roleTargetSchema,
]);

const revisionSchema = Type.Object({
	heading: Type.String({ minLength: 1, maxLength: 1000 }),
	instruction: Type.String({ minLength: 1, maxLength: 20000 }),
	expectedOutcome: Type.Optional(nullableText),
	priority: Type.Optional(Type.Union([Type.Literal("urgent"), Type.Literal("standard")])),
	registryVolume: Type.Optional(Type.Union([Type.Literal("operations"), Type.Literal("official")])),
	completionDueAt: Type.Optional(Type.Union([Type.String({ format: "date-time" }), Type.Null()])),
	sourceDocumentVersionId: Type.Optional(Type.Union([idSchema, Type.Null()])),
	targets: Type.Array(directiveTargetSchema, { minItems: 1, maxItems: 500 }),
}, { additionalProperties: false });

const createDirectiveSchema = Type.Intersect([
	revisionSchema,
	Type.Object({
		referenceNumber: Type.Optional(Type.Union([Type.String({ minLength: 1, maxLength: 120 }), Type.Null()])),
		acknowledgementRequired: Type.Optional(Type.Boolean()),
		completionRequired: Type.Optional(Type.Boolean()),
	}),
]);
const amendDirectiveSchema = Type.Intersect([
	revisionSchema,
	Type.Object({ changeReason: Type.String({ minLength: 1, maxLength: 5000 }) }),
]);
const issueDirectiveSchema = Type.Object({
	referenceNumber: Type.String({ minLength: 1, maxLength: 120 }),
	effectiveFrom: Type.Optional(Type.Union([Type.String({ format: "date-time" }), Type.Null()])),
	effectiveUntil: Type.Optional(Type.Union([Type.String({ format: "date-time" }), Type.Null()])),
}, { additionalProperties: false });
const reasonSchema = Type.Object({ reason: Type.String({ minLength: 1, maxLength: 5000 }) }, { additionalProperties: false });
const acknowledgementSchema = Type.Object({ statement: Type.Optional(nullableText) }, { additionalProperties: false });
const evidenceSchema = Type.Union([
	Type.Object({ documentVersionId: idSchema, description: Type.Optional(nullableText) }, { additionalProperties: false }),
	Type.Object({ mediaAssetId: idSchema, description: Type.Optional(nullableText) }, { additionalProperties: false }),
]);
const acceptanceSchema = Type.Object({ note: Type.Optional(nullableText) }, { additionalProperties: false });
const directiveParamsSchema = Type.Object({ directiveId: idSchema });
const evidenceParamsSchema = Type.Object({ directiveId: idSchema, evidenceId: idSchema });
const mutationHeadersSchema = Type.Object({ "if-match": Type.String({ minLength: 1 }) }, { additionalProperties: true });
const listDirectiveQuerySchema = Type.Object({
	status: Type.Optional(Type.Union([Type.Literal("draft"), Type.Literal("issued"), Type.Literal("withdrawn"), Type.Literal("completed")])),
	search: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
}, { additionalProperties: false });

type CreateDirectiveBody = Static<typeof createDirectiveSchema>;
type AmendDirectiveBody = Static<typeof amendDirectiveSchema>;
type IssueDirectiveBody = Static<typeof issueDirectiveSchema>;
type ReasonBody = Static<typeof reasonSchema>;
type AcknowledgementBody = Static<typeof acknowledgementSchema>;
type EvidenceBody = Static<typeof evidenceSchema>;
type AcceptanceBody = Static<typeof acceptanceSchema>;
type DirectiveParams = Static<typeof directiveParamsSchema>;
type EvidenceParams = Static<typeof evidenceParamsSchema>;
type MutationHeaders = Static<typeof mutationHeadersSchema>;
type ListDirectiveQuery = Static<typeof listDirectiveQuerySchema>;

function toRevisionInput(body: CreateDirectiveBody | AmendDirectiveBody): DirectiveRevisionInput {
	return {
		heading: body.heading.trim(),
		instruction: body.instruction.trim(),
		expectedOutcome: body.expectedOutcome?.trim() || null,
		priority: body.priority ?? "standard",
		registryVolume: body.registryVolume ?? "official",
		completionDueAt: body.completionDueAt ? new Date(body.completionDueAt) : null,
		sourceDocumentVersionId: body.sourceDocumentVersionId ?? null,
		targets: body.targets.map((target): DirectiveTarget => {
			if (target.type !== "role") return target;
			return {
				...target,
				scopeUnitId: target.scopeUnitId ?? null,
				scopeOfficeId: target.scopeOfficeId ?? null,
			};
		}),
	};
}

function expectedVersion(headers: MutationHeaders): number {
	const normalized = headers["if-match"].trim().replace(/^W\//, "").replace(/^"|"$/g, "");
	const revision = Number(normalized);
	if (!Number.isSafeInteger(revision) || revision < 1) {
		throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
			message: "If-Match must contain a positive directive version",
		});
	}
	return revision;
}

export {
	acceptanceSchema,
	acknowledgementSchema,
	amendDirectiveSchema,
	createDirectiveSchema,
	directiveParamsSchema,
	evidenceParamsSchema,
	evidenceSchema,
	expectedVersion,
	issueDirectiveSchema,
	listDirectiveQuerySchema,
	mutationHeadersSchema,
	reasonSchema,
	toRevisionInput,
	type AcceptanceBody,
	type AcknowledgementBody,
	type AmendDirectiveBody,
	type CreateDirectiveBody,
	type DirectiveParams,
	type EvidenceBody,
	type EvidenceParams,
	type IssueDirectiveBody,
	type ListDirectiveQuery,
	type MutationHeaders,
	type ReasonBody,
};
