import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type { DirectiveListFilter } from "../../domain/directive.models.js";
import type DirectiveQueryService from "../services/DirectiveQuery.service.js";

class ListDirectivesUseCase {
	constructor(private readonly queries: DirectiveQueryService) {}
	execute(actor: ActorContext, filter: DirectiveListFilter) { return this.queries.list(actor, filter); }
}
export default ListDirectivesUseCase;
