import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentTypeController from "../controllers/documentType/DocumentTypeController.js";
import {
	docTypeCreationSchema,
	type DocTypeCreationType,
} from "../types/docType.type.js";

async function documentTypeRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentTypeController;
	},
) {
	const docTypeController = options.controller;

	fastify.post(
		"/type",
		{ schema: { body: docTypeCreationSchema } },
		async (
			request: FastifyRequest<{ Body: DocTypeCreationType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;
			// const { uid } = request.user!;

			// if (!uid)
			// 	return reply.code(401).send({
			// 		success: true,
			// 		message:
			// 			"Only an authorized user can carry out this operation.",
			// 	});

			const newDocumentType = await docTypeController.createDocumentType(
				// uid,
                '',
				payload,
			);

			return reply.code(201).send({
				success: true,
				data: newDocumentType,
			});
		},
	);

    fastify.get(
		"/types",
		async (request: FastifyRequest, reply: FastifyReply) => {
            const { uid } = request.user!;

             if(!uid) 
                return reply.code(401).send({
                    success: true,
                    message: "No uid extracted from access token"
                })

            // fetch document types
            const docTypes = await docTypeController.getAllDocTypes();

            return reply.code(200).send({
                success: true,
                data: docTypes
            })
        });
}

export default documentTypeRoutes;