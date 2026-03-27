import type GetWorkflowUseCase from "../../application/usecases/GetWorkflow.usecase.js";

class WorkflowController {
    constructor(private readonly getWorkflowUseCase: GetWorkflowUseCase){}

    async getWorkflowByDocument(documentId: string) {
        const workflow = await this.getWorkflowUseCase.getWorkflowByDocument(documentId)

        return workflow;
    }
}

export default WorkflowController