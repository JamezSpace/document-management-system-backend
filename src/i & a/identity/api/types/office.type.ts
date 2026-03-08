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

const editOfficeDesignationSchema = Type.Object({
    officeId: Type.String()
})

type CreateOfficeType = Static<typeof createOfficeSchema>
type CreateOfficeDesignationType = Static<typeof createOfficeDesignationSchema>
type EditOfficeDesignationType = Static<typeof editOfficeDesignationSchema>

export {
    createOfficeSchema, type CreateOfficeType,
    createOfficeDesignationSchema, type CreateOfficeDesignationType,
    editOfficeDesignationSchema, type EditOfficeDesignationType
}