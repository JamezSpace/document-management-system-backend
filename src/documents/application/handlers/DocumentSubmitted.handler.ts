import type { EventDetails } from "../../../shared/application/port/services/eventbus.port.js";
import type { WorkflowStarterPort } from "../../../shared/application/port/WorkflowStarter.port.js";

class DocumentSubmittedHandler {
	constructor(
		private readonly workflowStarter: WorkflowStarterPort
	) {}

	async handle(event: EventDetails) {
		const { documentId } = event.payload;

		await this.workflowStarter.startWorkflow(documentId);
	}
}

export default DocumentSubmittedHandler;