import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentController from "../controllers/document/DocumentController.js";
import {
	docStaffIdSchema,
	documentIdSchema,
	documentSchema,
	documentSchemaForCreation,
	documentSchemaForSave,
	type DocStaffIdSchemaType,
	type DocumentIdSchemaType,
	type DocumentSchemaForSaveType,
	type DocumentSchemaType,
	type DocumentSchemaTypeForCreation,
} from "../types/document.type.js";
import ApiError from "../../../shared/errors/ApiError.error.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";

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

	// get a document with id
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
			const doc = await documentController.fetchDocById(docId);

			if (!doc)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${docId} doesn't exist`,
				});

			return reply.code(200).send({
				success: true,
				data: doc,
			});
		},
	);

	// save document changes
	fastify.post(
		"/:docId/save",
		{ schema: { params: documentIdSchema, body: documentSchemaForSave } },
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: DocumentSchemaForSaveType;
			}>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { docId } = request.params;
			const { contentDelta, document: documentToSave } = request.body;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			if (docId !== documentToSave.id)
				throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
					message:
						"Mismatch between document ID input and id of the document!",
				});

			const savedDoc = await documentController.saveDocument(
				documentToSave,
				contentDelta,
			);

			if (!savedDoc)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${docId} doesn't exist`,
				});

			return reply.status(200).send({
				success: true,
				data: savedDoc,
			});
		},
	);

	// submit document
	fastify.post(
		"/:docId/submit",
		{ schema: { params: documentIdSchema, body: documentSchema } },
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
                Body: DocumentSchemaType
			}>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { docId } = request.params;
            const documentToSubmit = request.body

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
            
            const submitedDoc = await documentController.submitDocument(uid, documentToSubmit);

            return reply.code(200).send({
                success: true,
                data: submitedDoc
            })
		},
	);
}

export default documentRoutes;
