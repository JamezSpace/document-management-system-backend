import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type { DirectiveRevisionInput } from "../../domain/directive.models.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class AmendDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, expectedVersion: number, input: { revision: DirectiveRevisionInput; changeReason: string }, evidence?: RequestEvidence) {
		return this.commands.amend(actor, directiveId, expectedVersion, input, evidence);
	}
}
export default AmendDirectiveUseCase;
