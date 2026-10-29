import { Type, type Static } from "@fastify/type-provider-typebox";

const profileRevisionHeadersSchema = Type.Object(
	{
		"if-match": Type.String({ pattern: '^"profile-[1-9][0-9]*"$' }),
	},
	{ additionalProperties: true },
);

const updateOwnProfileSchema = Type.Object(
	{
		phoneNumber: Type.String({
			minLength: 10,
			maxLength: 16,
			pattern: "^\\+?[0-9]{10,15}$",
		}),
	},
	{ additionalProperties: false },
);

const replaceProfilePictureSchema = Type.Object(
	{
		profilePicture: Type.Any(),
	},
	{ additionalProperties: false },
);

const uploadIdentityChangeMediaSchema = Type.Object(
	{
		purpose: Type.Union([Type.Literal("evidence"), Type.Literal("signature")]),
		file: Type.Any(),
	},
	{ additionalProperties: false },
);

const requestIdentityChangeSchema = Type.Object(
	{
		changes: Type.Object(
			{
				firstName: Type.Optional(Type.String({ minLength: 1, maxLength: 25 })),
				middleName: Type.Optional(
					Type.Union([Type.String({ minLength: 1, maxLength: 25 }), Type.Null()]),
				),
				lastName: Type.Optional(Type.String({ minLength: 1, maxLength: 25 })),
				email: Type.Optional(Type.String({ format: "email", maxLength: 255 })),
				signature: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
			},
			{ additionalProperties: false, minProperties: 1 },
		),
		reason: Type.String({ minLength: 2, maxLength: 1000 }),
		evidenceMediaIds: Type.Optional(
			Type.Array(Type.String({ minLength: 1, maxLength: 80 }), {
				maxItems: 10,
				uniqueItems: true,
			}),
		),
	},
	{ additionalProperties: false },
);

type ProfileRevisionHeaders = Static<typeof profileRevisionHeadersSchema>;
type UpdateOwnProfileBody = Static<typeof updateOwnProfileSchema>;
type ReplaceProfilePictureBody = Static<typeof replaceProfilePictureSchema>;
type UploadIdentityChangeMediaBody = Static<typeof uploadIdentityChangeMediaSchema>;
type RequestIdentityChangeBody = Static<typeof requestIdentityChangeSchema>;

export {
	profileRevisionHeadersSchema,
	replaceProfilePictureSchema,
	uploadIdentityChangeMediaSchema,
	requestIdentityChangeSchema,
	updateOwnProfileSchema,
	type ProfileRevisionHeaders,
	type ReplaceProfilePictureBody,
	type UploadIdentityChangeMediaBody,
	type RequestIdentityChangeBody,
	type UpdateOwnProfileBody,
};
