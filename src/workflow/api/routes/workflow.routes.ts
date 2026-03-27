import type {
	FastifyInstance,
	FastifyRegister,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type WorkflowController from "../controller/WorkflowController.js";
import {
	documentIdSchema,
	type DocumentIdType,
} from "../types/workflow.types.js";
import ApiError from "../../../shared/errors/ApiError.error.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";

async function workflowRoutes(
	fastify: FastifyInstance,
	options: { controller: WorkflowController },
) {
	const workflowController = options.controller;

	fastify.get(
		"/documents/:documentId",
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdType }>,
			reply: FastifyReply,
		) => {
			const { id: docId } = request.params;

			const workflow =
				await workflowController.getWorkflowByDocument(docId);

			if (!workflow)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Workflow for document with id: ${docId} doesn't exist`,
				});
                
			return reply.code(200).send({ success: true, data: workflow });
		},
	);
}

export default workflowRoutes;
