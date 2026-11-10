import type { FastifyInstance } from "fastify";
import type NotificationController from "../controllers/NotificationController.js";
import { routePolicies } from "../../../security/application/type/authorization.type.js";

async function notificationRoutes(
	fastify: FastifyInstance,
	options: {
		controller: NotificationController;
	},
) {
	const notificationController = options.controller;

	fastify.get(
		"/me",
		{
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (request, reply) => {
			const staffId = request.actor!.staffId;
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
