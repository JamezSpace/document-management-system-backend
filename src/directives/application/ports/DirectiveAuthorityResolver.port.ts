import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DirectiveAuthoritySnapshot } from "../../domain/directive.models.js";

interface DirectiveAuthorityResolverPort {
	resolve(
		staffId: string,
		assignmentId: string,
		tx: TransactionContext,
	): Promise<DirectiveAuthoritySnapshot | null>;
}

export type { DirectiveAuthorityResolverPort };
