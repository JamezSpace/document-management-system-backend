import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";
import ApiError from "../../../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../../../shared/errors/enum/api.enum.js";
import type SelfServiceController from "../../controllers/user/SelfService.controller.js";
import {
	profileRevisionHeadersSchema,
	replaceProfilePictureSchema,
	requestIdentityChangeSchema,
	uploadIdentityChangeMediaSchema,
	updateOwnProfileSchema,
	type ProfileRevisionHeaders,
	type ReplaceProfilePictureBody,
	type RequestIdentityChangeBody,
	type UploadIdentityChangeMediaBody,
	type UpdateOwnProfileBody,
} from "../../types/user/selfService.type.js";

async function selfServiceRoutes(
	fastify: FastifyInstance,
	options: { controller: SelfServiceController },
) {
	fastify.get(
		"/me",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request, reply) => {
			const settings = await options.controller.getSettings(request.actor!);
			return reply
				.header("ETag", `"profile-${settings.revision}"`)
				.code(200)
				.send({ success: true, data: settings });
		},
	);

	fastify.patch(
		"/me/profile",
		{
			schema: {
				headers: profileRevisionHeadersSchema,
				body: updateOwnProfileSchema,
			},
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{
				Headers: ProfileRevisionHeaders;
				Body: UpdateOwnProfileBody;
			}>,
			reply: FastifyReply,
		) => {
			const result = await options.controller.updateProfile(
				request.actor!,
				request.body.phoneNumber,
				parseRevision(request.headers["if-match"]),
				request.id,
			);
			return reply
				.header("ETag", `"profile-${result.revision}"`)
				.code(200)
				.send({ success: true, data: result });
		},
	);

	fastify.put(
		"/me/profile-picture",
		{
			schema: {
				headers: profileRevisionHeadersSchema,
				body: replaceProfilePictureSchema,
			},
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{
				Headers: ProfileRevisionHeaders;
				Body: ReplaceProfilePictureBody;
			}>,
			reply: FastifyReply,
		) => {
			const file = await resolveFilePayload(request.body.profilePicture);
			const result = await options.controller.replaceProfilePicture(
				request.actor!,
				file,
				parseRevision(request.headers["if-match"]),
				request.id,
			);
			return reply
				.header("ETag", `"profile-${result.revision}"`)
				.code(200)
				.send({ success: true, data: result });
		},
	);

	fastify.post(
		"/me/change-request-media",
		{
			schema: { body: uploadIdentityChangeMediaSchema },
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{ Body: UploadIdentityChangeMediaBody }>,
			reply: FastifyReply,
		) => {
			const file = await resolveFilePayload(request.body.file);
			const result = await options.controller.uploadChangeRequestMedia(
				request.actor!,
				{ purpose: request.body.purpose, file },
				request.id,
			);
			return reply.code(201).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/me/change-requests",
		{
			schema: { body: requestIdentityChangeSchema },
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{ Body: RequestIdentityChangeBody }>,
			reply: FastifyReply,
		) => {
			const result = await options.controller.createChangeRequest(
				request.actor!,
				request.body,
				request.id,
			);
			return reply.code(202).send({ success: true, data: result });
		},
	);

	fastify.get(
		"/me/change-requests",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request, reply) => {
			const changes = await options.controller.listChangeRequests(request.actor!);
			return reply.code(200).send({ success: true, data: changes });
		},
	);
}

function parseRevision(value: string): number {
	return Number(/^"profile-(\d+)"$/.exec(value)?.[1]);
}

async function resolveFilePayload(
	file: unknown,
): Promise<{ buffer: Buffer; mimeType?: string }> {
	if (Buffer.isBuffer(file)) return { buffer: file };
	if (file && typeof file === "object") {
		const mimeType = (file as { mimetype?: string }).mimetype;
		const value = (file as { value?: unknown }).value;
		if (Buffer.isBuffer(value)) return mimeType ? { buffer: value, mimeType } : { buffer: value };
		const toBuffer = (file as { toBuffer?: () => Promise<Buffer> }).toBuffer;
		if (typeof toBuffer === "function") {
			const buffer = await toBuffer();
			return mimeType ? { buffer, mimeType } : { buffer };
		}
	}
	throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
		message: "Invalid profile picture payload",
	});
}

export default selfServiceRoutes;
