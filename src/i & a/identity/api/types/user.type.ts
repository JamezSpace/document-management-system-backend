import { Type, type Static } from "@fastify/type-provider-typebox";
import { IdentityStatus } from "../../domain/IdentityStatus.js";

const userSchema = Type.Object({
	uid: Type.String(),
	name: Type.String(),
	email: Type.String(),
	role: Type.String(),
	status: Type.Enum(IdentityStatus),
});

const userSchemaForSignup = Type.Object({
	uid: Type.String(),
	name: Type.String(),
	email: Type.String(),
	role: Type.String(),
});

const userSchemaForLogin = Type.Object({
	uid: Type.String(),
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
