import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type CorrespondenceSubjectController from "../controllers/correspondenceSubject/CorrespondenceSubjectController.js";
import {
	corrSubjectSchema,
	type CorrSubjectType,
} from "../types/corrSubject.type.js";

async function correspondenceSubjectRoutes(
	fastify: FastifyInstance,
	options: {
		controller: CorrespondenceSubjectController;
	},
) {
	const correspondenceSubjectController = options.controller;

	fastify.post(
		"/subject",
		{ schema: { body: corrSubjectSchema } },
		async (
			request: FastifyRequest<{ Body: CorrSubjectType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newCorrSubject =
				await correspondenceSubjectController.createCorrespondenceSubject(
					payload,
				);

			return reply.code(201).send({
				success: true,
				corrSubject: newCorrSubject,
			});
		},
	);
}

export default correspondenceSubjectRoutes;
