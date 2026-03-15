import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentRetentionPolicyController from "../controllers/DocumentRetentionPolicyController.js";
import {
    createDocumentRetentionPolicySchema,
    type CreateDocumentRetentionPolicyType,
} from "../types/docRetPolicy.type.js";

async function documentRetentionPolicyRoutes(
    fastify: FastifyInstance,
    options: {
        controller: DocumentRetentionPolicyController;
    },
) {
    const documentRetentionPolicyController = options.controller;

    fastify.post(
        "/retention",
        { schema: { body: createDocumentRetentionPolicySchema } },
        async (
            request: FastifyRequest<{ Body: CreateDocumentRetentionPolicyType }>,
            reply: FastifyReply,
        ) => {
            const payload = request.body;
            const { uid } = request.user!;

            if (!uid)
                return reply.code(401).send({
                    success: true,
                    message: "Only an authorized user can carry out this operation.",
                });

            const newPolicy =
                await documentRetentionPolicyController.createDocumentRetentionPolicy(
                    uid,
                    payload
                );

            return reply.code(201).send({
                success: true,
                data: newPolicy
            });
        },
    );
}

export default documentRetentionPolicyRoutes;
