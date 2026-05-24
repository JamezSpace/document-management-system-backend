import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface DocumentView {
	docId: string;
	owner: {
		id: string;
		unitId: string;
		officeId: string;
		designationId: string;
	};
}

interface WorkflowDocumentPort {
	getDocumentById(
		documentId: string,
		tx?: TransactionContext,
	): Promise<DocumentView>;
}

export type { DocumentView, WorkflowDocumentPort };

