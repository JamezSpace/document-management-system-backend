import type { IdentityGovernancePolicyPort } from "../../../shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { IdentityGovernancePolicyRepositoryPort } from "../port/repo/IdentityGovernancePolicyRepo.port.js";

const IDENTITY_GOVERNANCE_POLICY_KEY = "nexusfons_identity_governance";

class IdentityGovernancePolicyService implements IdentityGovernancePolicyPort {
	private cache: { expiresAt: number; policy: Awaited<ReturnType<IdentityGovernancePolicyRepositoryPort["findActive"]>> } | null = null;

	constructor(
		private readonly repository: IdentityGovernancePolicyRepositoryPort,
		private readonly cacheTtlMs = 5_000,
		private readonly policyKey = IDENTITY_GOVERNANCE_POLICY_KEY,
	) {}

	async getActivePolicy() {
		return (await this.loadActive()).toSnapshot();
	}

	async evaluateField(field: string) {
		const policy = await this.loadActive();
		return {
			policyKey: policy.policyKey,
			policyVersion: policy.policyVersion,
			decision: policy.evaluate(field),
		};
	}

	private async loadActive() {
		if (this.cache?.policy && this.cache.expiresAt > Date.now()) {
			return this.cache.policy;
		}

		const policy = await this.repository.findActive(
			this.policyKey,
			new Date(),
		);
		if (!policy) {
			throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
				message: "No active identity governance policy is configured",
			});
		}

		this.cache = { policy, expiresAt: Date.now() + this.cacheTtlMs };
		return policy;
	}
}

export default IdentityGovernancePolicyService;
