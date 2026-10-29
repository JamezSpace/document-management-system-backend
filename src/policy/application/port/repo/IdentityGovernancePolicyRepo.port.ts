import type { IdentityGovernancePolicy } from "../../../domain/identityGovernance/IdentityGovernancePolicy.js";

interface IdentityGovernancePolicyRepositoryPort {
	findActive(policyKey: string, effectiveAt: Date): Promise<IdentityGovernancePolicy | null>;
}

export type { IdentityGovernancePolicyRepositoryPort };
