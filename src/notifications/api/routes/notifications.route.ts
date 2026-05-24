import type { FastifyInstance, FastifyRequest } from "fastify";
import type NotificationController from "../controllers/NotificationController.js";
import {
	staffIdSchema,
	type StaffIdType,
} from "../types/notifications.type.js";

async function notificationRoutes(
	fastify: FastifyInstance,
	options: {
		controller: NotificationController;
	},
) {
	const notificationController = options.controller;

	fastify.get(
		"/:sId",
		{ schema: { params: staffIdSchema } },
		async (request: FastifyRequest<{ Params: StaffIdType }>, reply) => {
			const { uid } = request.user!;
			const { sId: staffId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			const notifications =
				await notificationController.getStaffNotifications(staffId);

			return reply.code(200).send({
				success: true,
				data: notifications,
			});
		},
	);
}

export default notificationRoutes;
