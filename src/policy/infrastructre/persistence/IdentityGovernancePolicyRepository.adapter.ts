import type { PostgresDb } from "@fastify/postgres";
import type { IdentityGovernancePolicyRepositoryPort } from "../../application/port/repo/IdentityGovernancePolicyRepo.port.js";
import {
	IdentityGovernancePolicy,
	type IdentityGovernancePolicyPayload,
} from "../../domain/identityGovernance/IdentityGovernancePolicy.js";

class IdentityGovernancePolicyRepositoryAdapter
	implements IdentityGovernancePolicyRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async findActive(policyKey: string, effectiveAt: Date) {
		const result = await this.dbPool.query(
			`WITH selected_policy AS (
				SELECT *
				FROM policy.identity_governance_policies
				WHERE policy_key = $1
				  AND status = 'active'
				  AND effective_from <= $2
				  AND (effective_to IS NULL OR effective_to > $2)
				ORDER BY effective_from DESC, policy_version DESC
				LIMIT 1
			)
			SELECT selected_policy.*,
				rule.field_name,
				rule.mode,
				rule.requirements,
				rule.reason_code,
				rule.priority
			FROM selected_policy
			LEFT JOIN policy.identity_governance_rules rule
			  ON rule.governance_policy_id = selected_policy.id
			ORDER BY rule.priority, rule.field_name`,
			[policyKey, effectiveAt],
		);

		if (result.rows.length === 0) return null;
		const header = result.rows[0];
		const payload: IdentityGovernancePolicyPayload = {
			policyKey: header.policy_key,
			policyVersion: header.policy_version,
			schemaVersion: header.schema_version,
			status: header.status,
			effectiveFrom: new Date(header.effective_from),
			effectiveTo: header.effective_to ? new Date(header.effective_to) : null,
			definitionChecksum: header.definition_checksum,
			metadata: header.metadata,
			rules: result.rows
				.filter((row) => row.field_name !== null)
				.map((row) => ({
					field: row.field_name,
					mode: row.mode,
					reasonCode: row.reason_code,
					requirements: row.requirements ?? [],
				})),
		};

		return new IdentityGovernancePolicy(payload);
	}
}

export default IdentityGovernancePolicyRepositoryAdapter;
