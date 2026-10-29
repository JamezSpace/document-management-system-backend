import DomainError from "../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import type {
	IdentityGovernanceFieldDecision,
	IdentityGovernanceMode,
	IdentityGovernancePolicySnapshot,
} from "../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";

const modes = new Set<IdentityGovernanceMode>([
	"direct",
	"verification_required",
	"approval_required",
	"read_only",
]);

interface IdentityGovernancePolicyPayload {
	policyKey: string;
	policyVersion: number;
	schemaVersion: number;
	status: string;
	effectiveFrom: Date;
	effectiveTo: Date | null;
	definitionChecksum: string;
	metadata: Record<string, unknown>;
	rules: IdentityGovernanceFieldDecision[];
}

class IdentityGovernancePolicy {
	readonly policyKey: string;
	readonly policyVersion: number;
	private readonly rules: ReadonlyMap<string, IdentityGovernanceFieldDecision>;

	constructor(payload: IdentityGovernancePolicyPayload) {
		const now = Date.now();
		if (
			!payload.policyKey ||
			!Number.isInteger(payload.policyVersion) ||
			payload.policyVersion <= 0 ||
			payload.schemaVersion !== 1 ||
			payload.status !== "active" ||
			payload.effectiveFrom.getTime() > now ||
			(payload.effectiveTo !== null && payload.effectiveTo.getTime() <= now) ||
			!/^[a-f\d]{64}$/i.test(payload.definitionChecksum) ||
			payload.metadata.defaultEffect !== "deny" ||
			payload.rules.length === 0
		) {
			this.invalid("Stored identity governance policy is invalid");
		}

		const indexed = new Map<string, IdentityGovernanceFieldDecision>();
		for (const rule of payload.rules) {
			if (
				!rule.field ||
				!rule.reasonCode ||
				!modes.has(rule.mode) ||
				indexed.has(rule.field) ||
				!Array.isArray(rule.requirements) ||
				rule.requirements.some((requirement) => !requirement.trim())
			) {
				this.invalid(`Invalid identity governance rule for '${rule.field}'`);
			}
			indexed.set(rule.field, Object.freeze({
				...rule,
				requirements: Object.freeze([...rule.requirements]) as unknown as string[],
			}));
		}

		this.policyKey = payload.policyKey;
		this.policyVersion = payload.policyVersion;
		this.rules = indexed;
	}

	evaluate(field: string): IdentityGovernanceFieldDecision {
		return this.rules.get(field) ?? {
			field,
			mode: "read_only",
			reasonCode: "identity_field_not_governed_for_self_service",
			requirements: [],
		};
	}

	toSnapshot(): IdentityGovernancePolicySnapshot {
		return {
			policyKey: this.policyKey,
			policyVersion: this.policyVersion,
			fields: Object.fromEntries(
				Array.from(this.rules.entries()).map(([field, decision]) => [
					field,
					{
						mode: decision.mode,
						reasonCode: decision.reasonCode,
						requirements: [...decision.requirements],
					},
				]),
			),
		};
	}

	private invalid(message: string): never {
		throw new DomainError(
			GlobalDomainErrors.identity_authority.identity.INVALID_GOVERNANCE_POLICY,
			{ message },
		);
	}
}

export { IdentityGovernancePolicy };
export type { IdentityGovernancePolicyPayload };
