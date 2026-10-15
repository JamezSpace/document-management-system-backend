import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type { DirectiveRevisionInput } from "../../domain/directive.models.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class CreateDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, input: { referenceNumber: string | null; acknowledgementRequired: boolean; completionRequired: boolean; revision: DirectiveRevisionInput }, evidence?: RequestEvidence) {
		return this.commands.create(actor, input, evidence);
	}
}
export default CreateDirectiveUseCase;
