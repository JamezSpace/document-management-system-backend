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
            const {uid} = request.user!

            if(!uid) 
                return reply.code(401).send({
                    success: true,
                    message: "Only an authorized user can carry out this operation."
                })

			const newBusinessFunction =
				await businessFunctionController.createBusinessFunction(
                    uid, payload
				);

			return reply.code(201).send({
				success: true,
				data: newBusinessFunction,
			});
        }
	);

    fastify.get(
		"/functions",
		async (request: FastifyRequest, reply: FastifyReply) => {
            const { uid } = request.user!;

             if(!uid) 
                return reply.code(401).send({
                    success: true,
                    message: "No uid extracted from access token"
                })

            // fetch business functions
            const functions = await businessFunctionController.getAllBussFunctions();

            return reply.code(200).send({
                success: true,
                data: functions
            })
        },
	);
}

export default businessFunctionRoutes;
