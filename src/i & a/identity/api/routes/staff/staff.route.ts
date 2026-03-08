import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type StaffController from "../../controllers/staff/Staff.controller.js";
import {
    createStaffSchema,
    editStaffSchema,
    registerStaffSchema,
    staffIdSchema,
    staffMediaNeededBySchema,
    StaffMediaRequester,
    unitIdSchema,
    type CreateStaffType,
    type EditStaffType,
    type RegisterStaffType,
    type StaffIdType,
    type StaffMediaNeededByType,
    type UnitIdType
} from "../../types/staff/staff.type.js";

async function staffRoutes(
	fastify: FastifyInstance,
	options: { controller: StaffController },
) {
	const staffController = options.controller;

	// add a new staff - manual approach; register staff instead
	fastify.post(
		"/staff",
		{ schema: { body: createStaffSchema } },
		async (
			request: FastifyRequest<{ Body: CreateStaffType }>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const payload = request.body;

			// save data in database
			const newStaff = await staffController.addNewStaff(payload);

			return reply.code(201).send({
				success: true,
				newStaff,
			});
		},
	);

	// register a new staff
	fastify.post(
		"/staff/register",
		{ schema: { body: registerStaffSchema } },
		async (
			request: FastifyRequest<{ Body: RegisterStaffType }>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const payload = request.body;

			// save data in database
			const newStaff = await staffController.registerNewStaff(payload);

			return reply.code(201).send({
				success: true,
				staffId: newStaff.staffId,
			});
		},
	);

	// update an existing staff
	fastify.patch(
		"/staff/:staffId",
		{ schema: { params: staffIdSchema, body: editStaffSchema } },
		async (
			request: FastifyRequest<{ Params: StaffIdType, Body: EditStaffType }>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const { staffId } = request.params;
            const editToMakeOnStaff = request.body

			// call controller
			const updatedStaff =
				await staffController.updateExistingStaff(staffId, editToMakeOnStaff);

			return reply.code(200).send({
				success: true,
				updatedStaff,
			});
		},
	);

	// get a specific staff member
	fastify.get(
		"/staff/:staffId",
		{ schema: { params: staffIdSchema } },
		async (
			request: FastifyRequest<{ Params: StaffIdType }>,
			reply: FastifyReply,
		) => {
			const { staffId } = request.params;

			const existingStaff = await staffController.fetchExistingStaff(staffId);

			return reply.code(200).send({
				success: true,
				staff: existingStaff,
			});
		},
	);

    // this retrieves all staff members in an office
    fastify.get(
        "/:officeId/staff",
        {schema: {params: unitIdSchema }},
        async (request: FastifyRequest<{Params: UnitIdType}>, reply: FastifyReply) => {
            const { unitId } = request.params;

			const officeStaffMembers =
				await staffController.fetchAllStaffMembersByUnit(unitId);

			return reply.code(200).send({
				success: true,
				officeStaffMembers
			});
        }
    )
}

export default staffRoutes;
