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

	fastify.get(
		"/subjects",
		async (request: FastifyRequest, reply: FastifyReply) => {
            const { uid } = request.user!;

             if(!uid) 
                return reply.code(401).send({
                    success: true,
                    message: "No uid extracted from access token"
                })

            // fetch correspondence subjects
            const subjects = await correspondenceSubjectController.getAllCorrSubjects();

            return reply.code(200).send({
                success: true,
                data: subjects
            })
        },
	);
}

export default correspondenceSubjectRoutes;
