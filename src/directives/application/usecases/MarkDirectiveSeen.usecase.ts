import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class MarkDirectiveSeenUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, evidence?: RequestEvidence) {
		return this.commands.markSeen(actor, directiveId, evidence);
	}
}
export default MarkDirectiveSeenUseCase;
