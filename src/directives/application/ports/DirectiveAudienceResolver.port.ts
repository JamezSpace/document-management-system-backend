import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { ResolvedDirectiveAudienceMember } from "../../domain/directive.models.js";

interface DirectiveAudienceResolverPort {
	resolve(
		directiveRevisionId: string,
		tx: TransactionContext,
	): Promise<ResolvedDirectiveAudienceMember[]>;
}

export type { DirectiveAudienceResolverPort };
