import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type BusinessFunctionController from "../controllers/businessFunction/BusinessFunctionController.js";
import {
	bussFunctionSchema,
	type BussFunctionType,
} from "../types/bussFunction.type.js";

async function businessFunctionRoutes(
	fastify: FastifyInstance,
	options: {
		controller: BusinessFunctionController;
	},
) {
    const businessFunctionController = options.controller;

	fastify.post(
		"/function",
		{ schema: { body: bussFunctionSchema } },
		async (
			request: FastifyRequest<{ Body: BussFunctionType }>,
			reply: FastifyReply,
		) => {
            const payload = request.body;

			const newBusinessFunction =
				await businessFunctionController.createBusinessFunction(
					payload
				);

			return reply.code(201).send({
				success: true,
				bussFunction: newBusinessFunction,
			});
        }
	);
}

export default businessFunctionRoutes;
