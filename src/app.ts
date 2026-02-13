import fastify, {type FastifyInstance, type FastifyReply, type FastifyRequest} from "fastify";
import middlewareAdapterInstance from "./identity/api/middleware/adapter/firebase.middleware.adapter.js";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { GenericError } from "./shared/api/types/GenericError.type.js";

const server: FastifyInstance = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

// load plugins (from the Fastify ecosystem) next
// load your plugins (your custom plugins) next
// load decorators next

// load hooks next
server.addHook('preHandler', middlewareAdapterInstance.validateUserIsAuthenticated);

server.get('/', (request: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send('hit base end point')
})

// decorate fastify instance with user property
server.decorateRequest('user', {
    uid: ''
});

// set global error handler
server.setErrorHandler((error: GenericError, request: FastifyRequest, reply: FastifyReply) => {
    console.log("handler error:", error);
    
    if(error)    
        return reply.code(error.httpStatusCode).send({
            success: false,
            error: {
                code: error.errorCode,
                message: error.errorMessage,
                details: error?.details
            }
        })

    return reply.code(500).send({
        "success": false,
    })
})

server.listen(
    { port: Number(process.env?.PORT) || 4200, host: "0.0.0.0" },
	(err, address) => {
		if (err) {
			server.log.error(err);
			process.exit(1);
		}

		server.log.info(`Server running on port ${address}!`);
	}
)