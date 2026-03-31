import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type OfficeController from "../../controllers/office/Office.controller.js";
import {
	createOfficeSchema,
	type CreateOfficeType,
} from "../../types/office.type.js";
import { unitIdSchema, type UnitIdType } from "../../types/staff/staff.type.js";

async function officeRoutes(
	fastify: FastifyInstance,
	options: {
		controller: OfficeController;
	},
) {
	const officeController = options.controller;

	fastify.get(
		"/:unitId/offices",
		{ schema: { params: unitIdSchema } },
		async (
			request: FastifyRequest<{ Params: UnitIdType }>,
			reply: FastifyReply,
		) => {
            const { unitId } = request.params;

			const offices = await officeController.getAllOfficesWithinAUnit(unitId);

			return reply.code(200).send({
				success: true,
				data: offices,
			});
		},
	);

	fastify.get(
		"/offices",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const offices = await officeController.getAllOffices();

			return reply.code(200).send({
				success: true,
				data: offices,
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
				data: newOffice,
			});
		},
	);
}

export default officeRoutes;
