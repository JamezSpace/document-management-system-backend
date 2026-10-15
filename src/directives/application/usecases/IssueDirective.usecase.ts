import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class IssueDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, expectedVersion: number, input: { referenceNumber: string; effectiveFrom: Date | null; effectiveUntil: Date | null }, evidence?: RequestEvidence) {
		return this.commands.issue(actor, directiveId, expectedVersion, input, evidence);
	}
}
export default IssueDirectiveUseCase;
