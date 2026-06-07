import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface DocumentIdentityPort {
	resolveUnitHeadDesignation(
		recipientUnitId: string,
        tx?: TransactionContext
	): Promise<{ id: string; title: string }>;
}

export type { DocumentIdentityPort };
