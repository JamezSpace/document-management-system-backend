import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";
import type StaffAdministrationController from "../../controllers/staff/StaffAdministration.controller.js";
import {
	identityChangeDecisionSchema,
	identityChangeRequestIdSchema,
	identityChangeReviewListQuerySchema,
	type IdentityChangeDecisionBody,
	type IdentityChangeRequestIdParams,
	type IdentityChangeReviewListQuery,
} from "../../types/staff/staffAdministration.type.js";

async function staffAdministrationRoutes(
	fastify: FastifyInstance,
	options: { controller: StaffAdministrationController },
) {
	fastify.get(
		"/identity-change-requests",
		{
			schema: { querystring: identityChangeReviewListQuerySchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.IDENTITY_CHANGE_REVIEW,
				),
			},
		},
		async (
			request: FastifyRequest<{ Querystring: IdentityChangeReviewListQuery }>,
			reply: FastifyReply,
		) => {
			const result = await options.controller.listIdentityChanges(request.query);
			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/identity-change-requests/:requestId/decision",
		{
			schema: {
				params: identityChangeRequestIdSchema,
				body: identityChangeDecisionSchema,
			},
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.IDENTITY_CHANGE_REVIEW,
				),
			},
		},
		async (
			request: FastifyRequest<{
				Params: IdentityChangeRequestIdParams;
				Body: IdentityChangeDecisionBody;
			}>,
			reply: FastifyReply,
		) => {
			const result = await options.controller.reviewIdentityChange(
				request.actor!,
				request.params.requestId,
				request.body.decision,
				request.body.reason,
				request.id,
			);
			return reply.code(200).send({ success: true, data: result });
		},
	);
}

export default staffAdministrationRoutes;
