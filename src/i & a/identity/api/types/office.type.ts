import { Type, type Static } from "@fastify/type-provider-typebox";

const createOfficeSchema = Type.Object({
    name: Type.String(),
    unitId: Type.String()
})

const createOfficeDesignationSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    hierarchyLevel: Type.Number(),
    officeId: Type.String()
})

type CreateOfficeType = Static<typeof createOfficeSchema>
type CreateOfficeDesignationType = Static<typeof createOfficeDesignationSchema>

export {
    createOfficeSchema, type CreateOfficeType,
    createOfficeDesignationSchema, type CreateOfficeDesignationType
}