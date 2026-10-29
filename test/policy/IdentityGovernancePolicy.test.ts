import { strict as assert } from "node:assert";
import { test } from "node:test";

import IdentityGovernancePolicyService from "../../src/policy/application/services/IdentityGovernancePolicy.service.js";
import { IdentityGovernancePolicy } from "../../src/policy/domain/identityGovernance/IdentityGovernancePolicy.js";

function activePolicy() {
	return new IdentityGovernancePolicy({
		policyKey: "nexusfons_identity_governance",
		policyVersion: 1,
		schemaVersion: 1,
		status: "active",
		effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
		effectiveTo: null,
		definitionChecksum: "a".repeat(64),
		metadata: { defaultEffect: "deny" },
		rules: [
			{
				field: "phoneNumber",
				mode: "direct",
				reasonCode: "self_phone_change_allowed",
				requirements: ["audit_identity_change"],
			},
		],
	});
}

test("identity governance fails closed for fields absent from policy", () => {
	const decision = activePolicy().evaluate("status");
	assert.equal(decision.mode, "read_only");
	assert.equal(
		decision.reasonCode,
		"identity_field_not_governed_for_self_service",
	);
});

test("identity governance service caches the active policy", async () => {
	let calls = 0;
	const service = new IdentityGovernancePolicyService(
		{
			async findActive() {
				calls += 1;
				return activePolicy();
			},
		},
		60_000,
	);

	const first = await service.evaluateField("phoneNumber");
	const second = await service.getActivePolicy();
	assert.equal(first.decision.mode, "direct");
	assert.equal(second.policyVersion, 1);
	assert.equal(calls, 1);
});
