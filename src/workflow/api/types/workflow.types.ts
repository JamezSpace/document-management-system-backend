import { Type, type Static } from "@fastify/type-provider-typebox";

const documentIdSchema = Type.Object({
    id: Type.String()
})


type DocumentIdType = Static<typeof documentIdSchema>;

export {
    documentIdSchema, type DocumentIdType
}