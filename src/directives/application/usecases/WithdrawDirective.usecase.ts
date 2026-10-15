import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type DirectiveCommandService from "../services/DirectiveCommand.service.js";
import type { RequestEvidence } from "../services/DirectiveCommand.service.js";

class WithdrawDirectiveUseCase {
	constructor(private readonly commands: DirectiveCommandService) {}
	execute(actor: ActorContext, directiveId: string, expectedVersion: number, reason: string, evidence?: RequestEvidence) {
		return this.commands.withdraw(actor, directiveId, expectedVersion, reason, evidence);
	}
}
export default WithdrawDirectiveUseCase;
