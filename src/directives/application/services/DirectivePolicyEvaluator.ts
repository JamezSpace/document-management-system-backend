import AuthorizationService from "../../../security/application/services/AuthorizationService.js";
import type {
	ActorContext,
	ActorGrant,
	ResourceScope,
} from "../../../security/application/type/authorization.type.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { Directive } from "../../domain/directive.models.js";

class DirectivePolicyEvaluator {
	constructor(private readonly authorization = new AuthorizationService()) {}

	assertCapability(
		actor: ActorContext,
		capability: string,
		directive?: Directive,
	): ActorGrant {
		const scope = directive ? this.scopeOf(directive) : this.actorHomeScope(actor);
		const grant = this.bestGrant(actor, capability, scope);
		if (!grant) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, {
				message: `Action ${capability} is not allowed for this directive scope`,
			});
		}
		return grant;
	}

	canView(actor: ActorContext, directive: Directive): boolean {
		return this.authorization.hasCapability(actor, "directive.view", this.scopeOf(directive));
	}

	private bestGrant(
		actor: ActorContext,
		capability: string,
		scope: ResourceScope,
	): ActorGrant | undefined {
		const weight = { office: 3, unit: 2, organization: 1 } as const;
		return actor.grants
			.filter((grant) =>
				grant.capability === capability &&
				this.authorization.hasCapability(
					{ ...actor, grants: [grant] },
					capability,
					scope,
				),
			)
			.sort((left, right) => weight[right.scope.type] - weight[left.scope.type])[0];
	}

	private scopeOf(directive: Directive): ResourceScope {
		return {
			unitId: directive.issuingUnitId,
			officeId: directive.issuingOfficeId,
		};
	}

	private actorHomeScope(actor: ActorContext): ResourceScope {
		return { unitId: actor.unitId, officeId: actor.officeId };
	}
}

export default DirectivePolicyEvaluator;
