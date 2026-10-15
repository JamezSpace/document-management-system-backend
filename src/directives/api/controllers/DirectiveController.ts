import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type AcceptCompletionEvidenceUseCase from "../../application/usecases/AcceptCompletionEvidence.usecase.js";
import type AcknowledgeDirectiveUseCase from "../../application/usecases/AcknowledgeDirective.usecase.js";
import type AddCompletionEvidenceUseCase from "../../application/usecases/AddCompletionEvidence.usecase.js";
import type AmendDirectiveUseCase from "../../application/usecases/AmendDirective.usecase.js";
import type CompleteDirectiveUseCase from "../../application/usecases/CompleteDirective.usecase.js";
import type CreateDirectiveUseCase from "../../application/usecases/CreateDirective.usecase.js";
import type GetDirectiveEvidenceUseCase from "../../application/usecases/GetDirectiveEvidence.usecase.js";
import type GetDirectiveHistoryUseCase from "../../application/usecases/GetDirectiveHistory.usecase.js";
import type GetDirectiveUseCase from "../../application/usecases/GetDirective.usecase.js";
import type IssueDirectiveUseCase from "../../application/usecases/IssueDirective.usecase.js";
import type ListDirectivesUseCase from "../../application/usecases/ListDirectives.usecase.js";
import type MarkDirectiveSeenUseCase from "../../application/usecases/MarkDirectiveSeen.usecase.js";
import type WithdrawDirectiveUseCase from "../../application/usecases/WithdrawDirective.usecase.js";
import type { DirectiveListFilter, DirectiveRevisionInput } from "../../domain/directive.models.js";

class DirectiveController {
	constructor(
		private readonly createDirective: CreateDirectiveUseCase,
		private readonly amendDirective: AmendDirectiveUseCase,
		private readonly issueDirective: IssueDirectiveUseCase,
		private readonly withdrawDirective: WithdrawDirectiveUseCase,
		private readonly completeDirective: CompleteDirectiveUseCase,
		private readonly getDirective: GetDirectiveUseCase,
		private readonly listDirectives: ListDirectivesUseCase,
		private readonly getHistory: GetDirectiveHistoryUseCase,
		private readonly getEvidence: GetDirectiveEvidenceUseCase,
		private readonly markSeen: MarkDirectiveSeenUseCase,
		private readonly acknowledgeDirective: AcknowledgeDirectiveUseCase,
		private readonly addCompletionEvidence: AddCompletionEvidenceUseCase,
		private readonly acceptCompletionEvidence: AcceptCompletionEvidenceUseCase,
	) {}

	create(actor: ActorContext, input: { referenceNumber: string | null; acknowledgementRequired: boolean; completionRequired: boolean; revision: DirectiveRevisionInput }, requestId: string) { return this.createDirective.execute(actor, input, { requestId }); }
	amend(actor: ActorContext, id: string, version: number, input: { revision: DirectiveRevisionInput; changeReason: string }, requestId: string) { return this.amendDirective.execute(actor, id, version, input, { requestId }); }
	issue(actor: ActorContext, id: string, version: number, input: { referenceNumber: string; effectiveFrom: Date | null; effectiveUntil: Date | null }, requestId: string) { return this.issueDirective.execute(actor, id, version, input, { requestId }); }
	withdraw(actor: ActorContext, id: string, version: number, reason: string, requestId: string) { return this.withdrawDirective.execute(actor, id, version, reason, { requestId }); }
	complete(actor: ActorContext, id: string, version: number, requestId: string) { return this.completeDirective.execute(actor, id, version, { requestId }); }
	get(actor: ActorContext, id: string) { return this.getDirective.execute(actor, id); }
	list(actor: ActorContext, filter: DirectiveListFilter) { return this.listDirectives.execute(actor, filter); }
	history(actor: ActorContext, id: string) { return this.getHistory.execute(actor, id); }
	evidence(actor: ActorContext, id: string) { return this.getEvidence.execute(actor, id); }
	seen(actor: ActorContext, id: string, requestId: string) { return this.markSeen.execute(actor, id, { requestId }); }
	acknowledge(actor: ActorContext, id: string, statement: string | null, requestId: string) { return this.acknowledgeDirective.execute(actor, id, statement, { requestId }); }
	addEvidence(actor: ActorContext, id: string, input: { documentVersionId: string | null; mediaAssetId: string | null; description: string | null }, requestId: string) { return this.addCompletionEvidence.execute(actor, id, input, { requestId }); }
	acceptEvidence(actor: ActorContext, id: string, evidenceId: string, note: string | null) { return this.acceptCompletionEvidence.execute(actor, id, evidenceId, note); }
}

export default DirectiveController;
