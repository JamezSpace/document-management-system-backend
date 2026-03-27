interface DocumentView {
	id: string;
	ownerId: string;
	unitId: string;
	officeId: string;
    designationId?: string;
}

interface WorkflowDocumentPort {
	getDocumentById(documentId: string): Promise<DocumentView>;
}

export type { WorkflowDocumentPort, DocumentView };
