import type {
	FastifyInstance,
    FastifyRequest,
	FastifyReply,
	FastifyRouterOptions,
} from "fastify";

async function IdentityRoutes(
	fastify: FastifyInstance,
	options: FastifyRouterOptions<any>,
) {
	// this is called to add a new user to the system
	fastify.post(
		"/register",
		async (request: FastifyRequest, reply: FastifyReply) => {
			// save the data to firebase

			// retrieve the uid of the user alongside information of the user and store in our database
		},
	);

	// this is called to retrieve user's identity from our system
	fastify.get(
		"/user/:id",
		async (
			request: FastifyRequest<{ Params: { id: string } }>,
			reply: FastifyReply,
		) => {
            
        },
	);
}

export default IdentityRoutes;
