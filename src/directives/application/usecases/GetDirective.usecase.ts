import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveQueryService from "../services/DirectiveQuery.service.js";

class GetDirectiveUseCase {
	constructor(private readonly queries: DirectiveQueryService) {}
	execute(actor: ActorContext, directiveId: string) { return this.queries.get(actor, directiveId); }
}
export default GetDirectiveUseCase;
