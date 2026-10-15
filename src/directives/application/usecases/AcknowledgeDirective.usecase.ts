import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class AcknowledgeDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, statement: string | null, evidence?: RequestEvidence) {
		return this.commands.acknowledge(actor, directiveId, statement, evidence);
	}
}
export default AcknowledgeDirectiveUseCase;
