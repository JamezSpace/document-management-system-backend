import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type OfficeController from "../../controllers/office/Office.controller.js";
import {
	createOfficeSchema,
	type CreateOfficeType,
} from "../../types/office.type.js";

async function officeRoutes(
	fastify: FastifyInstance,
	options: {
		controller: OfficeController;
	},
) {
	const officeController = options.controller;

	fastify.get(
		"/offices",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const offices = await officeController.getAllOffices();

			return reply.code(200).send({
				success: true,
				offices,
			});
		},
	);

	fastify.post(
		"/office",
		{ schema: { body: createOfficeSchema } },
		async (
			request: FastifyRequest<{ Body: CreateOfficeType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newOffice = await officeController.addNewOffice(payload);

			return reply.code(201).send({
				success: true,
				newOffice,
			});
		},
	);
}

export default officeRoutes;
