import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
    createOfficeDesignationSchema,
    createOfficeSchema,
    editOfficeDesignationSchema,
    type CreateOfficeDesignationType,
    type CreateOfficeType,
    type EditOfficeDesignationType,
} from "../../types/office.type.js";
import type OfficeDesignationController from "../../controllers/office/OfficeDesignation.controller.js";

async function officeDesignationRoutes(
    fastify: FastifyInstance,
    options: {
        controller: OfficeDesignationController;
    },
) {
    const designationController = options.controller;

    fastify.get(
        "/office/:officeId/designations",
        {schema: {params: editOfficeDesignationSchema}},
        async (request: FastifyRequest<{Params: EditOfficeDesignationType}>, reply: FastifyReply) => {
            const officeId = request.params.officeId;
            
            const officeDesignations = await designationController.getAllOfficeDesignations(officeId);

            return reply.code(200).send({
                success: true,
                officeName: officeDesignations.officeName,
                designations: officeDesignations.designations
            });
        },
    );

    fastify.post(
        "/office/designation",
        { schema: { body: createOfficeDesignationSchema } },
        async (
            request: FastifyRequest<{ Body: CreateOfficeDesignationType }>,
            reply: FastifyReply,
        ) => {
            const payload = request.body;

            const newOfficeDesignation = await designationController.addNewOfficeDesignation(payload);

            return reply.code(201).send({
                success: true,
                newOfficeDesignation
            });
        },
    );
}

export default officeDesignationRoutes;
