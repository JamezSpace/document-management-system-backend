import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentController from "../controllers/document/DocumentController.js";
import {
	documentSchemaForCreation,
	type DocumentSchemaTypeForCreation,
} from "../types/document.type.js";

async function documentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentController;
	},
) {
	const documentController = options.controller;

	fastify.post(
		"/",
		{ schema: { body: documentSchemaForCreation } },
		async (
			request: FastifyRequest<{ Body: DocumentSchemaTypeForCreation }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newDocument =
				await documentController.createDocument(payload);

			return reply.code(201).send({
				success: true,
				document: newDocument,
			});
		},
	);
}

export default documentRoutes;
