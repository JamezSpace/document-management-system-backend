import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveQueryService from "../services/DirectiveQuery.service.js";

class GetDirectiveHistoryUseCase {
	constructor(private readonly queries: DirectiveQueryService) {}
	execute(actor: ActorContext, directiveId: string) { return this.queries.history(actor, directiveId); }
}
export default GetDirectiveHistoryUseCase;
