import { fastifyPostgres } from "@fastify/postgres";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, {
    type FastifyInstance,
    type FastifyReply,
    type FastifyRequest,
} from "fastify";
import DocumentSubsystem from "./documents/index.js";
import middlewareAdapterInstance from "./i & a/identity/api/middleware/adapter/FirebaseMiddleware.adapter.js";
import IdentityAccessSubsystem from "./i & a/index.js";
import type { NexusAppError } from "./shared/errors/api/nexusAppError.type.js";
import { dbConfig } from "./shared/infrastructure/persistence/primary/postgres.config.js";

const server: FastifyInstance = fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// load plugins (from the Fastify ecosystem) next
server.register(fastifyPostgres, dbConfig)

// load your plugins (your custom plugins) next
server.register(IdentityAccessSubsystem, { prefix: "identity" });
server.register(DocumentSubsystem, {prefix: 'document'});

// load decorators next

// decorate fastify instance with user property
server.decorateRequest("user", null);

// load hooks next
server.addHook(
	"preHandler",
	middlewareAdapterInstance.validateUserIsAuthenticated,
);

server.get("/", (request: FastifyRequest, reply: FastifyReply) => {
	reply.code(200).send("hit base end point");
});



// set global error handler
server.setErrorHandler(
	(error: NexusAppError, request: FastifyRequest, reply: FastifyReply) => {
		console.log("handler error:", error);

		if (error)
			return reply.code(error.httpStatusCode).send({
				success: false,
				error: {
					code: error.errorCode,
					message: error.errorMessage,
					details: error?.details,
				},
			});

		return reply.code(500).send({
			success: false,
		});
	},
);

server.listen(
	{ port: Number(process.env?.PORT) || 4200, host: "0.0.0.0" },
	(err, address) => {
		if (err) {
			server.log.error(err);
			process.exit(1);
		}

		server.log.info(`Server running on port ${address}!`);
	},
);
