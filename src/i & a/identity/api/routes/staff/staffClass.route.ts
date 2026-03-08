import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createStaffClassificationSchema, type CreateStaffClassificationType, classificationIdSchema, editStaffClassificationSchema, type ClassificationIdType, type EditStaffClassificationType, type CloseStaffClassificationType, closeStaffClassificationSchema } from "../../types/staff/staffClass.type.js";
import type StaffClassificationController from "../../controllers/staff/StaffClassification.controller.js";

async function staffClassificationRoutes(
	fastify: FastifyInstance,
	options: { controller: StaffClassificationController },
) {
	const staffClassificationController = options.controller;

	fastify.post(
		"/staff/classification",
		{ schema: { body: createStaffClassificationSchema } },
		async (
			request: FastifyRequest<{ Body: CreateStaffClassificationType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;
			const newStaffClassification =
				await staffClassificationController.addNewStaffClassification({
					staffId: payload.staffId,
					capabilityClass: payload.capabilityClass,
					authorityLevel: payload.authorityLevel,
					effectiveFrom: payload.effectiveFrom,
					effectiveTo: payload.effectiveTo,
				});

			return reply.code(201).send({
				success: true,
				newStaffClassification,
			});
		},
	);

    // call this to edit classification metadata
	fastify.patch(
		"/staff/classification/:classificationId",
		{
			schema: {
				params: classificationIdSchema,
				body: editStaffClassificationSchema,
			},
		},
		async (
			request: FastifyRequest<{
				Params: ClassificationIdType;
				Body: EditStaffClassificationType;
			}>,
			reply: FastifyReply,
		) => {
			const { classificationId } = request.params;
			const changesToMake = request.body;

			const editedStaffClassification =
				await staffClassificationController.editStaffClassificationMetadata(
					classificationId,
					changesToMake,
				);

			return reply.code(200).send({
				success: true,
				editedStaffClassification,
			});
		},
	);

    // call this to close a staff classification
    fastify.patch(
        "/staff/classification/:classificationId/close",
        {schema: {params: classificationIdSchema, body: closeStaffClassificationSchema}},
        async(request: FastifyRequest<{Params: ClassificationIdType, Body: CloseStaffClassificationType}>, reply: FastifyReply) => {
            const { classificationId } = request.params
            const {effectiveTo: closureDate} = request.body;

            const closedStaffClassification = await staffClassificationController.closeStaffClassification(classificationId, closureDate)

            return reply.code(200).send({
				success: true,
				closedStaffClassification,
			});
        }
    )
}

export default staffClassificationRoutes;
