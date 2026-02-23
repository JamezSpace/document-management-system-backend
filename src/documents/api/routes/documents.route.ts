import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentController from "../controllers/DocumentController.js";
import { documentSchemaForCreation, type DocumentSchemaTypeForCreation } from "../types/document.type.js";

async function documentRoutes(fastify: FastifyInstance, options: {
    controller: DocumentController
}) {
    const documentController = options.controller

    fastify.post(
        '/', 
        {schema: {body: documentSchemaForCreation}},
        async (request: FastifyRequest<{Body: DocumentSchemaTypeForCreation}>, reply: FastifyReply) => {
            const newDocumentPaylod = request.body
            
            const newDocument = await documentController.createDocument(newDocumentPaylod);

            return reply.code(201).send({
                success: true,
                docuument: newDocument
            })
    })
}

export default documentRoutes;