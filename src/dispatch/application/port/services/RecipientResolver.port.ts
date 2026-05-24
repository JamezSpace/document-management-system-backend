interface RecipientResolverPort {
    resolveRecipients(input: {
        documentId: string;
    }): Promise<Array<{
        staffId: string;
        unitId: string;
        designationId: string;
    }>>;
}

export type { RecipientResolverPort };