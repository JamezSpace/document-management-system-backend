import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";

class AcceptCompletionEvidenceUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, evidenceId: string, note: string | null) {
		return this.commands.acceptEvidence(actor, directiveId, evidenceId, note);
	}
}
export default AcceptCompletionEvidenceUseCase;
