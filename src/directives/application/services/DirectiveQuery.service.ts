import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { DirectiveListFilter } from "../../domain/directive.models.js";
import { DirectiveCapabilities } from "../../domain/enum/directiveCapabilities.enum.js";
import type { DirectiveRepositoryPort } from "../ports/DirectiveRepository.port.js";
import DirectivePolicyEvaluator from "./DirectivePolicyEvaluator.js";

class DirectiveQueryService {
	constructor(
		private readonly repository: DirectiveRepositoryPort,
		private readonly policy = new DirectivePolicyEvaluator(),
	) {}

	list(actor: ActorContext, filter: DirectiveListFilter) {
		const grants = actor.grants.filter((grant) => grant.capability === DirectiveCapabilities.VIEW);
		return this.repository.list({
			staffId: actor.staffId,
			organization: grants.some((grant) => grant.scope.type === "organization"),
			unitIds: grants.flatMap((grant) => grant.scope.type === "unit" ? [grant.scope.id] : []),
			officeIds: grants.flatMap((grant) => grant.scope.type === "office" ? [grant.scope.id] : []),
		}, filter);
	}

	async get(actor: ActorContext, directiveId: string) {
		const directive = await this.requireDirective(directiveId);
		await this.assertVisible(actor, directive);
		return directive;
	}

	async history(actor: ActorContext, directiveId: string) {
		await this.get(actor, directiveId);
		return this.repository.listHistory(directiveId);
	}

	async evidence(actor: ActorContext, directiveId: string) {
		const directive = await this.get(actor, directiveId);
		return {
			authority: directive.issuedAt ? {
				staffId: directive.issuedByStaffId,
				assignmentId: directive.issuedUnderAssignmentId,
				name: directive.issuerNameSnapshot,
				designation: directive.issuerDesignationSnapshot,
				unitName: directive.issuerUnitNameSnapshot,
				issuedAt: directive.issuedAt,
			} : null,
			completion: await this.repository.listEvidence(directiveId),
		};
	}

	private async requireDirective(id: string) {
		const directive = await this.repository.findById(id);
		if (!directive) throw new ApplicationError(ApplicationErrorEnum.DIRECTIVE_NOT_FOUND, { message: "Directive was not found", details: { directiveId: id } });
		return directive;
	}

	private async assertVisible(actor: ActorContext, directive: Awaited<ReturnType<DirectiveQueryService["requireDirective"]>>) {
		if (directive.issuedByStaffId === actor.staffId || this.policy.canView(actor, directive)) return;
		if (directive.currentRevisionId && await this.repository.isRecipient(directive.currentRevisionId, actor.staffId)) return;
		throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "The directive is outside the actor's authorized scope" });
	}
}

export default DirectiveQueryService;
