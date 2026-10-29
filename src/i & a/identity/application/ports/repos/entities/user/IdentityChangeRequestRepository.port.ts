import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { IdentityChangeRequestRecord } from "../../../../types/user/selfService.type.js";

interface IdentityChangeRequestRepositoryPort {
	saveBatch(
		requests: IdentityChangeRequestRecord[],
		tx: TransactionContext,
	): Promise<void>;

	listByIdentity(identityId: string): Promise<IdentityChangeRequestRecord[]>;

	findById(
		requestId: string,
		tx?: TransactionContext,
	): Promise<IdentityChangeRequestRecord | null>;

	listForReview(filters: {
		status?: IdentityChangeRequestRecord["status"];
		limit: number;
		offset: number;
	}): Promise<{ items: IdentityChangeRequestRecord[]; total: number }>;

	completeReview(
		requestId: string,
		decision: "rejected" | "applied",
		reviewerId: string,
		reviewReason: string,
		tx: TransactionContext,
	): Promise<boolean>;
}

export type { IdentityChangeRequestRepositoryPort };
