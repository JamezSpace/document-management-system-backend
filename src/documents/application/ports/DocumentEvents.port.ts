interface DocumentEventsPort {
    documentSubmitted(payload: {
        documentId: string,
        submittedBy: string,
        timestamp: Date
    }): Promise<void>

    documentCreated(payload: {
        documentId: string,
        createdBy: string,
        metadata: Record<string, any>,
        timestamp: Date
    }): Promise<void>

    documentApproved(payload: {
        documentId: string, 
        approvedBy: string,
        timestamp: Date
    }): Promise<void>

    documentRejected(payload: {
        documentId: string, 
        rejectedBy: string,
        reason: string,
        timestamp: Date
    }): Promise<void>

    documentArchived(payload : {
        documentId: string, 
        archivedBy: string,
        timestamp: Date
    }): Promise<void>
}

export type { DocumentEventsPort };