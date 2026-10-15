import type { FastifyInstance, FastifyRequest } from "fastify";
import { routePolicies } from "../../../security/application/type/authorization.type.js";
import { DirectiveCapabilities } from "../../domain/enum/directiveCapabilities.enum.js";
import type DirectiveController from "../controllers/DirectiveController.js";
import {
	acceptanceSchema, acknowledgementSchema, amendDirectiveSchema, createDirectiveSchema,
	directiveParamsSchema, evidenceParamsSchema, evidenceSchema, expectedVersion,
	issueDirectiveSchema, listDirectiveQuerySchema, mutationHeadersSchema, reasonSchema,
	toRevisionInput,
	type AcceptanceBody, type AcknowledgementBody, type AmendDirectiveBody,
	type CreateDirectiveBody, type DirectiveParams, type EvidenceBody, type EvidenceParams,
	type IssueDirectiveBody, type ListDirectiveQuery, type MutationHeaders, type ReasonBody,
} from "../types/directive.types.js";

async function directiveRoutes(fastify: FastifyInstance, options: { controller: DirectiveController }) {
	const controller = options.controller;

	fastify.post("/", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.CREATE) },
		schema: { body: createDirectiveSchema },
	}, async (request: FastifyRequest<{ Body: CreateDirectiveBody }>, reply) => {
		const directive = await controller.create(request.actor!, {
			referenceNumber: request.body.referenceNumber ?? null,
			acknowledgementRequired: request.body.acknowledgementRequired ?? false,
			completionRequired: request.body.completionRequired ?? false,
			revision: toRevisionInput(request.body),
		}, request.id);
		return reply.header("ETag", `"${directive.version}"`).code(201).send({ success: true, data: directive });
	});

	fastify.get("/", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.VIEW) },
		schema: { querystring: listDirectiveQuerySchema },
	}, async (request: FastifyRequest<{ Querystring: ListDirectiveQuery }>, reply) => {
		const directives = await controller.list(request.actor!, {
			...(request.query.status ? { status: request.query.status } : {}),
			...(request.query.search ? { search: request.query.search } : {}),
			limit: request.query.limit ?? 25,
		});
		return reply.code(200).send({ success: true, data: directives });
	});

	fastify.get("/:directiveId", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.VIEW) },
		schema: { params: directiveParamsSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams }>, reply) => {
		const directive = await controller.get(request.actor!, request.params.directiveId);
		return reply.header("ETag", `"${directive.version}"`).code(200).send({ success: true, data: directive });
	});

	fastify.post("/:directiveId/revisions", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.UPDATE) },
		schema: { params: directiveParamsSchema, headers: mutationHeadersSchema, body: amendDirectiveSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Headers: MutationHeaders; Body: AmendDirectiveBody }>, reply) => {
		const directive = await controller.amend(request.actor!, request.params.directiveId, expectedVersion(request.headers), {
			revision: toRevisionInput(request.body), changeReason: request.body.changeReason,
		}, request.id);
		return reply.header("ETag", `"${directive.version}"`).code(201).send({ success: true, data: directive });
	});

	fastify.post("/:directiveId/issue", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.ISSUE) },
		schema: { params: directiveParamsSchema, headers: mutationHeadersSchema, body: issueDirectiveSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Headers: MutationHeaders; Body: IssueDirectiveBody }>, reply) => {
		const directive = await controller.issue(request.actor!, request.params.directiveId, expectedVersion(request.headers), {
			referenceNumber: request.body.referenceNumber,
			effectiveFrom: request.body.effectiveFrom ? new Date(request.body.effectiveFrom) : null,
			effectiveUntil: request.body.effectiveUntil ? new Date(request.body.effectiveUntil) : null,
		}, request.id);
		return reply.header("ETag", `"${directive.version}"`).code(200).send({ success: true, data: directive });
	});

	fastify.post("/:directiveId/withdraw", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.WITHDRAW) },
		schema: { params: directiveParamsSchema, headers: mutationHeadersSchema, body: reasonSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Headers: MutationHeaders; Body: ReasonBody }>, reply) => {
		const directive = await controller.withdraw(request.actor!, request.params.directiveId, expectedVersion(request.headers), request.body.reason, request.id);
		return reply.header("ETag", `"${directive.version}"`).code(200).send({ success: true, data: directive });
	});

	fastify.post("/:directiveId/complete", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.ENFORCE) },
		schema: { params: directiveParamsSchema, headers: mutationHeadersSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Headers: MutationHeaders }>, reply) => {
		const directive = await controller.complete(request.actor!, request.params.directiveId, expectedVersion(request.headers), request.id);
		return reply.header("ETag", `"${directive.version}"`).code(200).send({ success: true, data: directive });
	});

	fastify.get("/:directiveId/history", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.VIEW) },
		schema: { params: directiveParamsSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams }>, reply) => reply.code(200).send({ success: true, data: await controller.history(request.actor!, request.params.directiveId) }));

	fastify.get("/:directiveId/evidence", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.VIEW) },
		schema: { params: directiveParamsSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams }>, reply) => reply.code(200).send({ success: true, data: await controller.evidence(request.actor!, request.params.directiveId) }));

	fastify.post("/:directiveId/deliveries/me/seen", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.VIEW) },
		schema: { params: directiveParamsSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams }>, reply) => reply.code(200).send({ success: true, data: await controller.seen(request.actor!, request.params.directiveId, request.id) }));

	fastify.post("/:directiveId/acknowledgements", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.ACKNOWLEDGE) },
		schema: { params: directiveParamsSchema, body: acknowledgementSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Body: AcknowledgementBody }>, reply) => reply.code(201).send({ success: true, data: await controller.acknowledge(request.actor!, request.params.directiveId, request.body.statement?.trim() || null, request.id) }));

	fastify.post("/:directiveId/evidence", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.ROUTE) },
		schema: { params: directiveParamsSchema, body: evidenceSchema },
	}, async (request: FastifyRequest<{ Params: DirectiveParams; Body: EvidenceBody }>, reply) => {
		const body = request.body;
		return reply.code(201).send({ success: true, data: await controller.addEvidence(request.actor!, request.params.directiveId, {
			documentVersionId: "documentVersionId" in body ? body.documentVersionId : null,
			mediaAssetId: "mediaAssetId" in body ? body.mediaAssetId : null,
			description: body.description?.trim() || null,
		}, request.id) });
	});

	fastify.post("/:directiveId/evidence/:evidenceId/accept", {
		config: { authorization: routePolicies.capability(DirectiveCapabilities.ENFORCE) },
		schema: { params: evidenceParamsSchema, body: acceptanceSchema },
	}, async (request: FastifyRequest<{ Params: EvidenceParams; Body: AcceptanceBody }>, reply) => reply.code(201).send({ success: true, data: await controller.acceptEvidence(request.actor!, request.params.directiveId, request.params.evidenceId, request.body.note?.trim() || null) }));
}

export default directiveRoutes;
