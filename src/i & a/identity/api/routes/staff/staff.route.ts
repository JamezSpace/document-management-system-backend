import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type StaffController from "../../controllers/staff/Staff.controller.js";
import {
	activateStaffSchema,
	createStaffSchema,
	editStaffSchema,
	registerStaffSchema,
	staffIdSchema,
	staffMediaNeededBySchema,
	StaffMediaRequester,
	unitIdSchema,
	userIdSchema,
	type ActivateStaffType,
	type CreateStaffType,
	type EditStaffType,
	type RegisterStaffType,
	type StaffIdType,
	type StaffMediaNeededByType,
	type UnitIdType,
	type UserIdType,
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

	// activate staff
	fastify.post(
		"/staff/:staffId/activate",
		{ schema: { params: staffIdSchema, body: activateStaffSchema } },
		async (
			request: FastifyRequest<{
				Params: StaffIdType;
				Body: ActivateStaffType;
			}>,
			reply: FastifyReply,
		) => {
			// extract information from request
			const { staffId } = request.params;
			const filesToUpload = request.body;

			// save data in database
			const status = await staffController.activateStaff(
				staffId,
				filesToUpload,
			);

			return reply.code(201).send({
				success: true,
				message: "Staff activated successfully",
			});
		},
	);

	// staff login
	fastify.get(
		"/staff/me",
		async (
			request: FastifyRequest,
			reply: FastifyReply,
		) => {
			const { uid, email } = request.user!;

            if(!uid) 
                return reply.code(401).send({
                    success: true,
                    message: "No uid extracted from access token"
                })

            // fetch staff details
            const staff = await staffController.fetchStaffDetailsForLogin(uid);

            return staff ? reply.code(200).send({
                success: true,
                data: staff
            }) : reply.code(404).send({
                success: true,
                message: "Staff not found"
            })
		},
	);

	// update an existing staff
	fastify.patch(
		"/staff/:staffId",
		{ schema: { params: staffIdSchema, body: editStaffSchema } },
		async (
			request: FastifyRequest<{
				Params: StaffIdType;
				Body: EditStaffType;
			}>,
			reply: FastifyReply,
		) => {
			// extract information from request body
			const { staffId } = request.params;
			const editToMakeOnStaff = request.body;

			// call controller
			const updatedStaff = await staffController.updateExistingStaff(
				staffId,
				editToMakeOnStaff,
			);

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

			const existingStaff =
				await staffController.fetchExistingStaff(staffId);

			return reply.code(200).send({
				success: true,
				staff: existingStaff,
			});
		},
	);

	// this retrieves all staff members in an office
	fastify.get(
		"/:unitId/staff",
		{ schema: { params: unitIdSchema } },
		async (
			request: FastifyRequest<{ Params: UnitIdType }>,
			reply: FastifyReply,
		) => {
			const { unitId } = request.params;

			const officeStaffMembers =
				await staffController.fetchAllStaffMembersByUnit(unitId);

			return reply.code(200).send({
				success: true,
				data: officeStaffMembers,
			});
		},
	);
}

export default staffRoutes;
