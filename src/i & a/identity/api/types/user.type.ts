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

type User = Static<typeof userSchema>;
type UserSignUpType = Static<typeof userSchemaForSignup>;
type UserLoginType = Static<typeof userSchemaForLogin>;

export {
    userSchema, userSchemaForLogin, userSchemaForSignup, type User, type UserLoginType, type UserSignUpType
};

