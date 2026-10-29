import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";
import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type StaffController from "../../controllers/staff/Staff.controller.js";
import type StaffAdministrationController from "../../controllers/staff/StaffAdministration.controller.js";
import {
    staffIdSchema,
    unitIdSchema,
    type StaffIdType,
    type UnitIdType
} from "../../types/staff/staff.type.js";
import {
	administrativeStaffListQuerySchema,
	administrativeStaffUpdateSchema,
	staffRevisionHeadersSchema,
	staffStatusTransitionSchema,
	type AdministrativeStaffListQuery,
	type AdministrativeStaffUpdateBody,
	type StaffRevisionHeaders,
	type StaffStatusTransitionBody,
} from "../../types/staff/staffAdministration.type.js";
import { inviteIdSchema, type InviteIdType } from "../../types/user/user.type.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";

async function staffRoutes(
	fastify: FastifyInstance,
	options: {
		controller: StaffController;
		administrationController: StaffAdministrationController;
	},
) {
	const staffController = options.controller;
	const administrationController = options.administrationController;

	// activate an accepted invite and create the corresponding staff record
	fastify.post(
		"/staff/invite",
		{
			schema: { body: inviteIdSchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_ACTIVATE,
				),
			},
		},
		async (
			request: FastifyRequest<{ Body: InviteIdType }>,
			reply: FastifyReply,
		) => {
			const { inviteId } = request.body;

			const activatedStaff = await staffController.createStaffViaInvite(
				inviteId,
				request.actor!.staffId,
			);

			return reply.code(201).send({
				success: true,
				data: activatedStaff,
			});
		},
	);

	// activate the pending staff record after password reset / account setup
	fastify.patch(
		"/staff/:staffId/activate",
		{
			schema: { params: staffIdSchema, body: inviteIdSchema },
			config: { authorization: routePolicies.authenticatedIdentity },
		},
		async (
			request: FastifyRequest<{ Params: StaffIdType, Body: InviteIdType }>,
			reply: FastifyReply,
		) => {
			const { staffId: sId } = request.params;
			const { inviteId: iId } = request.body;

            // adding the precenig tag removed prior
            const staffId = `STAFF-${sId}`
            const inviteId = `INVITE-${iId}`
			const authenticatedStaff =
				await staffController.fetchExistingStaffByAuthProviderId(
					request.user!.uid,
				);

			if (authenticatedStaff?.getStaffId() !== staffId) {
				throw new ApplicationError(
					ApplicationErrorEnum.USER_NOT_AUTHORIZED,
					{
						message:
							"The authenticated identity cannot activate this staff record",
					},
				);
			}

			const activatedStaff = await staffController.activateStaff(staffId, inviteId);

			return reply.code(200).send({
				success: true,
				data: activatedStaff,
			});
		},
	);

	// staff login
	fastify.get(
		"/staff/me",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const staff = await staffController.fetchStaffWithAuthority(
				request.actor!.staffId,
			);

			return staff
				? reply.code(200).send({
						success: true,
						data: staff,
					})
				: reply.code(404).send({
						success: true,
						message: "Staff not found",
					});
		},
	);

	// update an existing staff
	fastify.patch(
		"/staff/:staffId",
		{
			schema: {
				params: staffIdSchema,
				headers: staffRevisionHeadersSchema,
				body: administrativeStaffUpdateSchema,
			},
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_UPDATE,
				),
			},
		},
		async (
			request: FastifyRequest<{
				Params: StaffIdType;
				Headers: StaffRevisionHeaders;
				Body: AdministrativeStaffUpdateBody;
			}>,
			reply: FastifyReply,
		) => {
			const updatedStaff = await administrationController.updateStaff(
				request.actor!,
				request.params.staffId,
				request.body.changes,
				request.body.reason,
				parseStaffRevision(request.headers["if-match"]),
				request.id,
			);

			return reply
				.header("ETag", `"staff-${updatedStaff.revision}"`)
				.code(200)
				.send({ success: true, data: updatedStaff });
		},
	);

	// get a specific staff member
	fastify.get(
		"/staff/:staffId",
		{
			schema: { params: staffIdSchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_VIEW,
				),
			},
		},
		async (
			request: FastifyRequest<{ Params: StaffIdType }>,
			reply: FastifyReply,
		) => {
			const { staffId } = request.params;

			const existingStaff = await administrationController.getStaff(staffId);

			return reply
				.header("ETag", `"staff-${existingStaff.revision}"`)
				.code(200)
				.send({ success: true, data: existingStaff });
		},
	);

	fastify.post(
		"/staff/:staffId/status-transitions",
		{
			schema: {
				params: staffIdSchema,
				headers: staffRevisionHeadersSchema,
				body: staffStatusTransitionSchema,
			},
			config: {
				authorization: routePolicies.anyCapability(
					IdentityCapabilities.STAFF_ACTIVATE,
					IdentityCapabilities.STAFF_DEACTIVATE,
				),
			},
		},
		async (
			request: FastifyRequest<{
				Params: StaffIdType;
				Headers: StaffRevisionHeaders;
				Body: StaffStatusTransitionBody;
			}>,
			reply: FastifyReply,
		) => {
			const updatedStaff = await administrationController.transitionStatus(
				request.actor!,
				request.params.staffId,
				request.body.toStatus,
				request.body.reason,
				parseStaffRevision(request.headers["if-match"]),
				request.id,
			);
			return reply
				.header("ETag", `"staff-${updatedStaff.revision}"`)
				.code(200)
				.send({ success: true, data: updatedStaff });
		},
	);

    // get all staff - hr usage
    fastify.get(
		"/staff",
		{
			schema: { querystring: administrativeStaffListQuerySchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_LIST,
				),
			},
		},
		async (
			request: FastifyRequest<{ Querystring: AdministrativeStaffListQuery }>,
			reply: FastifyReply,
		) => {
			const allStaff = await administrationController.listStaff(request.query);

				return reply.code(200).send({
					success: true,
					data: allStaff,
				});
		},
	);

	// this retrieves all staff members in a unit
	fastify.get(
		"/:unitId/staff-members",
		{
			schema: { params: unitIdSchema },
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{ Params: UnitIdType }>,
			reply: FastifyReply,
		) => {
			const { unitId } = request.params;

			const officeStaffMembers =
				await staffController.fetchAllNonDeletedStaffMembersByUnit(unitId);

			return reply.code(200).send({
				success: true,
				data: officeStaffMembers,
			});
		},
	);
}

export default staffRoutes;

function parseStaffRevision(value: string): number {
	return Number(/^"staff-(\d+)"$/.exec(value)?.[1]);
}
