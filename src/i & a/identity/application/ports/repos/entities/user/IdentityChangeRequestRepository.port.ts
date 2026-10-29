import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { IdentityChangeRequestRecord } from "../../../../types/user/selfService.type.js";

interface IdentityChangeRequestRepositoryPort {
	saveBatch(
		requests: IdentityChangeRequestRecord[],
		tx: TransactionContext,
	): Promise<void>;

	listByIdentity(identityId: string): Promise<IdentityChangeRequestRecord[]>;
}

export type { IdentityChangeRequestRepositoryPort };
