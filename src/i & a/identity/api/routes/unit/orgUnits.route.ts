import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import OrgUnitController from "../../controllers/organizationalUnit/OrganizationUnit.controller.js";
import { createOrgUnitSchema, type CreateOrgUnitType } from "../../types/orgUnit.type.js";

async function orgUnitRoutes(
	fastify: FastifyInstance,
	options: { controller: OrgUnitController },
) {
	const orgController = options.controller;

	fastify.get(
		"/units",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const units = await orgController.getAllUnits();

			return reply.code(200).send({
				success: true,
				units,
			});
		},
	);

	fastify.post(
		"/unit",
		{ schema: { body: createOrgUnitSchema } },
		async (
			request: FastifyRequest<{ Body: CreateOrgUnitType }>,
			reply: FastifyReply,
		) => {
            const payload = request.body;

            const newUnit = await orgController.addNewUnit(payload);

            return reply.code(201).send({
                success: true,
                newUnit
            });
        }
	);
}

export default orgUnitRoutes;
