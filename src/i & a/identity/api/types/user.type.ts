import { Type, type Static } from "@fastify/type-provider-typebox";
import { IdentityStatus } from "../../domain/entities/user/IdentityStatus.js";

const userSchema = Type.Object({
	uid: Type.String(),
	email: Type.String(),
	phoneNum: Type.String(),
	status: Type.Enum(IdentityStatus),
	authProvider: Type.String(),
	authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForSignup = Type.Object({
	email: Type.String(),
	phoneNum: Type.String(),
	authProvider: Type.String(),
	authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForLogin = Type.Object({
	authProviderId: Type.String(),
});

const tokenIdSchema = Type.Object({
	token: Type.String(),
});

const inviteIdSchema = Type.Object({
	inviteId: Type.String(),
});

const initOnboardingSessionSchema = Type.Object({
	inviteId: Type.String(),
	email: Type.String(),
});

const editOnboardingSessionSchema = Type.Object({
	primaryData: Type.Object({
		firstName: Type.String(),
		lastName: Type.String(),
		middleName: Type.String(),
		email: Type.String(),
		staffId: Type.String(),
	}),
	currentStep: Type.Number({ maximum: 5 }),
});

const completeOnboardingSessionSchema = Type.Object({
	currentStep: Type.Number({ maximum: 5 }),
});

const sessionIdSchema = Type.Object({
	sessionId: Type.String(),
});

const uploadOnboardingMediaSchema = Type.Object({
	profilePic: Type.Optional(Type.Any()),
	signatureFile: Type.Optional(Type.Any()),
	currentStep: Type.Number({ minimum: 1, maximum: 5 }),
});

type User = Static<typeof userSchema>;
type UserSignUpType = Static<typeof userSchemaForSignup>;
type UserLoginType = Static<typeof userSchemaForLogin>;
type TokenIdType = Static<typeof tokenIdSchema>;
type InitOnboardingSessionType = Static<typeof initOnboardingSessionSchema>;
type EditOnboardingSessionType = Static<typeof editOnboardingSessionSchema>;
type CompleteOnboardingSessionType = Static<typeof completeOnboardingSessionSchema>;
type UploadOnboardingMediaType = Static<typeof uploadOnboardingMediaSchema>;
type SessionIdType = Static<typeof sessionIdSchema>;
type InviteIdType = Static<typeof inviteIdSchema>;

export {
    editOnboardingSessionSchema, completeOnboardingSessionSchema, initOnboardingSessionSchema, sessionIdSchema, tokenIdSchema, inviteIdSchema, uploadOnboardingMediaSchema, userSchema,
    userSchemaForLogin,
    userSchemaForSignup, type EditOnboardingSessionType, type CompleteOnboardingSessionType, type InitOnboardingSessionType, type SessionIdType, type InviteIdType, type TokenIdType, type UploadOnboardingMediaType, type User,
    type UserLoginType,
    type UserSignUpType
};

