import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentController from "../controllers/document/DocumentController.js";
import {
    docStaffIdSchema,
    documentIdSchema,
    documentSchemaForCreation,
    type DocStaffIdSchemaType,
    type DocumentIdSchemaType,
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
				data: newDocument,
			});
		},
	);

	// fetch all docs authored by staff
	fastify.get(
		"/documents/:staffId",
		{ schema: { params: docStaffIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocStaffIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { staffId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			// fetch documents by staff
			const docsByStaff =
				await documentController.fetchAllDocsByStaff(staffId);

			return reply.code(200).send({
				success: true,
				data: docsByStaff,
			});
		},
	);

	fastify.get(
		"/:docId",
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
            const { uid } = request.user!;
			const { docId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			// fetch document by id
			const doc =
				await documentController.fetchDocById(docId);

            return doc 
            ? 
			 reply.code(200).send({
				success: true,
				data: doc,
			}) :
            reply.code(404).send({
				success: true,
				data: null
			})
        }
	);
}

export default documentRoutes;
