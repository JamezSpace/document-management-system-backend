import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class CompleteDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, expectedVersion: number, evidence?: RequestEvidence) {
		return this.commands.complete(actor, directiveId, expectedVersion, evidence);
	}
}
export default CompleteDirectiveUseCase;
