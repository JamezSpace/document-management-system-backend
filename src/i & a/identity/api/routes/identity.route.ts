import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthenticationController from "../controllers/Authentication.controller.js";
import type AuthorityController from "../controllers/Authority.controller.js";
import {
	userSchemaForLogin,
	userSchemaForSignup,
	type UserLoginType,
	type UserSignUpType,
} from "../types/user.type.js";

async function identityRoutes(
	fastify: FastifyInstance,
	options: { controller: [AuthenticationController, AuthorityController] },
) {
	const authenticationController = options.controller[0];
	const authorityController = options.controller[1];

	// this is called to add a new user to the system
	fastify.post(
		"/register",
		{ schema: { body: userSchemaForSignup } },
		async (
			request: FastifyRequest<{ Body: UserSignUpType }>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const {
                authProviderId,
				firstName,
				lastName,
				middleName,
				email,
				authProvider,
			} = request.body;

			// save data in database
			const userIdentity = await authenticationController.addNewUser({
                authProviderId,
				firstName,
				lastName,
				middleName,
				email,
				authProvider,
			});

			return reply.code(201).send({
				success: true,
				user: userIdentity,
			});
		},
	);

    // this is called to activate a pending user
    fastify.patch(
		"/activate/:authProviderId",
		{ schema: { params: userSchemaForLogin } },
		async (
			request: FastifyRequest<{ Params: UserLoginType }>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const {
                authProviderId
			} = request.params;
            
			// call controller
			const userIdentity = await authenticationController.activatePendingUser(authProviderId)

			return reply.code(200).send({
				success: true,
				user: userIdentity,
			});
		},
	);

	// this is called to retrieve user's identity from our system
	fastify.get(
		"/user/:id",
		async (
			request: FastifyRequest<{ Params: { id: string } }>,
			reply: FastifyReply,
		) => {},
	);

	// when user logs in
	fastify.post(
		"/login",
		{ schema: { body: userSchemaForLogin } },
		async (
			request: FastifyRequest<{ Body: UserLoginType }>,
			reply: FastifyReply,
		) => {
			const userId = request.body.authProviderId;

			// get userId from my database. note, i had the option of getting this from user input but common programmer's rule is applied here, never trust user input or frontend
			const userIdentity =
				await authenticationController.authenticate(userId);

			const assignedRoles = await authorityController.authorizeImplicitly(
				userIdentity.getUserId(),
			);

			return reply.code(200).send({
				success: true,
				user: {
					id: userId,
					assignedRoles,
				},
			});
		},
	);
}

export default identityRoutes;
