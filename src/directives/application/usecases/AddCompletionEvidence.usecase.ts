import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class AddCompletionEvidenceUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, input: { documentVersionId: string | null; mediaAssetId: string | null; description: string | null }, evidence?: RequestEvidence) {
		return this.commands.addEvidence(actor, directiveId, input, evidence);
	}
}
export default AddCompletionEvidenceUseCase;
