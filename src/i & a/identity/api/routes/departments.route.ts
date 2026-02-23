import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DepartmentController from "../controllers/OrganizationUnit.controller.js";

async function departmentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DepartmentController;
	},
) {
	fastify.get(
		"/",
		async (request: FastifyRequest, reply: FastifyReply) => {

        },
	);
}

export default departmentRoutes;
