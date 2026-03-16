import { Type, type Static } from "@fastify/type-provider-typebox";

const docTypeCreationSchema = Type.Object({
    code: Type.String(),
    name: Type.String(),
})

type DocTypeCreationType = Static<typeof docTypeCreationSchema>;

export {
    docTypeCreationSchema, type DocTypeCreationType
}