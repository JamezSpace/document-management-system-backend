import { Type, type Static } from "@fastify/type-provider-typebox";
import { IdentityStatus } from "../../domain/IdentityStatus.js";

const userSchema = Type.Object({
	uid: Type.String(),
	email: Type.String(),
	status: Type.Enum(IdentityStatus),
    authProvider: Type.String(),
    authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForSignup = Type.Object({
	email: Type.String(),
    authProvider: Type.String(),
    authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForLogin = Type.Object({
	authProviderId: Type.String(),
});

type User = Static<typeof userSchema>;
type UserSignUpType = Static<typeof userSchemaForSignup>;
type UserLoginType = Static<typeof userSchemaForLogin>;

export {
	userSchema,
	userSchemaForSignup,
	userSchemaForLogin,
	type User,
    type UserSignUpType,
	type UserLoginType,
};
