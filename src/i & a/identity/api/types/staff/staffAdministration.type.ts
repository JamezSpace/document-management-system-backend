import { Type, type Static } from "@fastify/type-provider-typebox";
import { EmploymentType, Status } from "../../../domain/enum/staff.enum.js";

const staffRevisionHeadersSchema = Type.Object(
	{ "if-match": Type.String({ pattern: '^"staff-[1-9][0-9]*"$' }) },
	{ additionalProperties: true },
);

const administrativeStaffUpdateSchema = Type.Object(
	{
		changes: Type.Partial(
			Type.Object(
				{
					staffNumber: Type.Integer({ minimum: 1 }),
					employmentType: Type.Enum(EmploymentType),
					unitId: Type.String({ minLength: 1, maxLength: 80 }),
					officeId: Type.String({ minLength: 1, maxLength: 80 }),
					designationId: Type.String({ minLength: 1, maxLength: 80 }),
				},
				{ additionalProperties: false },
			),
			{ minProperties: 1 },
		),
		reason: Type.String({ minLength: 2, maxLength: 1000 }),
	},
	{ additionalProperties: false },
);

const staffStatusTransitionSchema = Type.Object(
	{
		toStatus: Type.Union([
			Type.Literal(Status.ACTIVE),
			Type.Literal(Status.SUSPENDED),
			Type.Literal(Status.RETIRED),
			Type.Literal(Status.RESIGNED),
			Type.Literal(Status.TERMINATED),
		]),
		reason: Type.String({ minLength: 2, maxLength: 1000 }),
	},
	{ additionalProperties: false },
);

const administrativeStaffListQuerySchema = Type.Object(
	{
		page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
		pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
		status: Type.Optional(Type.Enum(Status)),
		unitId: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
		search: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
	},
	{ additionalProperties: false },
);

const identityChangeReviewListQuerySchema = Type.Object(
	{
		page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
		pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
		status: Type.Optional(
			Type.Union([
				Type.Literal("pending"),
				Type.Literal("approved"),
				Type.Literal("rejected"),
				Type.Literal("applied"),
				Type.Literal("cancelled"),
			]),
		),
	},
	{ additionalProperties: false },
);

const identityChangeRequestIdSchema = Type.Object({
	requestId: Type.String({ minLength: 1, maxLength: 80 }),
});

const identityChangeDecisionSchema = Type.Object(
	{
		decision: Type.Union([Type.Literal("approve"), Type.Literal("reject")]),
		reason: Type.String({ minLength: 2, maxLength: 1000 }),
	},
	{ additionalProperties: false },
);

type StaffRevisionHeaders = Static<typeof staffRevisionHeadersSchema>;
type AdministrativeStaffUpdateBody = Static<typeof administrativeStaffUpdateSchema>;
type StaffStatusTransitionBody = Static<typeof staffStatusTransitionSchema>;
type AdministrativeStaffListQuery = Static<typeof administrativeStaffListQuerySchema>;
type IdentityChangeReviewListQuery = Static<typeof identityChangeReviewListQuerySchema>;
type IdentityChangeRequestIdParams = Static<typeof identityChangeRequestIdSchema>;
type IdentityChangeDecisionBody = Static<typeof identityChangeDecisionSchema>;

export {
	administrativeStaffListQuerySchema,
	administrativeStaffUpdateSchema,
	identityChangeDecisionSchema,
	identityChangeRequestIdSchema,
	identityChangeReviewListQuerySchema,
	staffRevisionHeadersSchema,
	staffStatusTransitionSchema,
	type AdministrativeStaffListQuery,
	type AdministrativeStaffUpdateBody,
	type IdentityChangeDecisionBody,
	type IdentityChangeRequestIdParams,
	type IdentityChangeReviewListQuery,
	type StaffRevisionHeaders,
	type StaffStatusTransitionBody,
};
