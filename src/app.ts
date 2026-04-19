import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { fastifyPostgres } from "@fastify/postgres";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, {
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";
import DocumentSubsystem from "./documents/index.js";
import PostgresWorkflowDocumentAdapter from "./documents/infrastructure/persistence/PostgresWorkflowDocument.adapter.js";
import RetentionService from "./documents/infrastructure/services/RetentionService.js";
import PostgresWorkflowAccessRepositoryAdapter from "./i & a/access/infrastructure/persistence/PostgresWorkflowAccessRepository.adapter.js";
import middlewareAdapterInstance from "./i & a/identity/api/middleware/adapter/FirebaseMiddleware.adapter.js";
import IdentityAccessSubsystem from "./i & a/index.js";
import NotificationSubsystem from "./notifications/index.js";
import PolicySubsystem from "./policy/index.js";
import PostgresDocumentRetentionPolicyAdapter from "./policy/infrastructre/persistence/PostgresDocRetentionPolicy.adapter.js";
import PostgresWorkflowPolicyAdapter from "./policy/infrastructre/persistence/PostgresWorkflowPolicy.adapter.js";
import type { NexusAppError } from "./shared/errors/api/nexusAppError.type.js";
import InMemoryEventBusAdapter from "./shared/infrastructure/InMemoryEventBus.js";
import { dbConfig } from "./shared/infrastructure/persistence/primary/postgres.config.js";
import WorkflowSubsystem from "./workflow/index.js";

const server: FastifyInstance = fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// load plugins (from the Fastify ecosystem) next
server.register(fastifyCors, {
	origin: process.env.FRONTEND_ORIGIN!,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
});
server.register(fastifyPostgres, dbConfig);
server.register(fastifyMultipart, {
	attachFieldsToBody: "keyValues",
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});

// global event bus
const eventBusAdapter = new InMemoryEventBusAdapter();

// load your plugins (your custom plugins) next
server.register(IdentityAccessSubsystem, { prefix: "api/identity" });

server.after(() => {
	// documents subsystem - cross system repo adapters
	const documentPolicyAdapter = new PostgresDocumentRetentionPolicyAdapter(
		server.pg,
	);
	const documentWorkflowAdapter = new PostgresWorkflowDocumentAdapter(
		server.pg,
	);
	const policyWorkflowAdapter = new PostgresWorkflowPolicyAdapter(server.pg);
	const accessWorkflowAdapter = new PostgresWorkflowAccessRepositoryAdapter(
		server.pg,
	);

	// documents subsystem - services
	const retentionService = new RetentionService(documentPolicyAdapter);

	server.register(DocumentSubsystem, {
		prefix: "api/document",
		retentionService,
		globalEventBus: eventBusAdapter,
	});

	server.register(PolicySubsystem, { prefix: "api/policy" });

	server.register(WorkflowSubsystem, {
		prefix: "workflow",
		documentWorkflowAdapter,
		policyWorkflowAdapter,
		accessWorkflowAdapter,
		globalEventBus: eventBusAdapter,
	});

	server.register(NotificationSubsystem, {
		prefix: "notifs",
		globalEventBus: eventBusAdapter,
	});
});

// load decorators next

// decorate fastify instance with user property
server.decorateRequest("user", null);

// load hooks next
server.addHook("preHandler", async (req: FastifyRequest, reply) => {
	const publicRoutes = [
		{
			method: ["GET"],
			pattern:
				/^\/api\/identity\/entity\/[^/]+$/,
		},
		{
			method: ["GET", "PATCH"],
			pattern:
				/^\/api\/identity\/staff\/onboarding\/session\/[^/]+$/,
		},
		{
			method: ["PATCH"],
			pattern:
				/^\/api\/identity\/staff\/onboarding\/session\/[^/]+\/completed$/,
		},
		{
			method: ["POST"],
			pattern:
				/^\/api\/identity\/staff\/onboarding\/session$/,
		},
		{
			method: ["POST"],
			pattern:
				/^\/api\/identity\/staff\/onboarding\/[^/]+\/media$/,
		},
	];

	const isPublic = publicRoutes.some(
		(route) => route.method.includes(req.method) && route.pattern.test(req.url),
	);

	console.log("Is Route Public:", isPublic);
	if (isPublic) return;

	return middlewareAdapterInstance.validateUserIsAuthenticated(req, reply);
});

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
