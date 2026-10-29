type IdentityGovernanceMode =
	| "direct"
	| "verification_required"
	| "approval_required"
	| "read_only";

interface IdentityGovernanceFieldDecision {
	field: string;
	mode: IdentityGovernanceMode;
	reasonCode: string;
	requirements: string[];
}

interface IdentityGovernancePolicySnapshot {
	policyKey: string;
	policyVersion: number;
	fields: Record<string, Omit<IdentityGovernanceFieldDecision, "field">>;
}

interface IdentityGovernancePolicyPort {
	getActivePolicy(): Promise<IdentityGovernancePolicySnapshot>;
	evaluateField(field: string): Promise<{
		policyKey: string;
		policyVersion: number;
		decision: IdentityGovernanceFieldDecision;
	}>;
}

export type {
	IdentityGovernanceFieldDecision,
	IdentityGovernanceMode,
	IdentityGovernancePolicyPort,
	IdentityGovernancePolicySnapshot,
};
