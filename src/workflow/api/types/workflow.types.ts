import { Type, type Static } from "@fastify/type-provider-typebox";

const documentIdSchema = Type.Object({
    documentId: Type.String()
})

const taskIdSchema = Type.Object({
    taskId: Type.String()
})

const workflowTaskActionSchema = Type.Object({
    minuteId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})


type DocumentIdType = Static<typeof documentIdSchema>;
type TaskIdType = Static<typeof taskIdSchema>;
type WorkflowTaskActionType = Static<typeof workflowTaskActionSchema>;

export {
    documentIdSchema,
    taskIdSchema,
    workflowTaskActionSchema,
    type DocumentIdType,
    type TaskIdType,
    type WorkflowTaskActionType,
}
