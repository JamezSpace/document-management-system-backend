interface DocumentAddresseePayload {
	documentId: string;
	recipientUnitId: string;
	addressedToDesignationId: string;
}

class DocumentAddressee {
    documentId: string;
	recipientUnitId: string;
	addressedToDesignationId: string;

	constructor(payload: DocumentAddresseePayload) {
        this.documentId = payload.documentId;
        this.recipientUnitId = payload.recipientUnitId;
        this.addressedToDesignationId = payload.addressedToDesignationId;
    }
}

export default DocumentAddressee;
export type { DocumentAddresseePayload };
