import type { PostgresDb } from "@fastify/postgres";
import type { PoolClient } from "pg";
import type { ActorContext, ActorGrant } from "../../src/security/application/type/authorization.type.js";
import UuidV7Generator from "../../src/shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import type { TransactionManager } from "../../src/shared/application/port/TransactionManager.port.js";
import DirectiveCommandService from "../../src/directives/application/services/DirectiveCommand.service.js";
import PostgresDirectiveAudienceResolver from "../../src/directives/infrastructure/identity/PostgresDirectiveAudienceResolver.adapter.js";
import PostgresDirectiveAuthorityResolver from "../../src/directives/infrastructure/identity/PostgresDirectiveAuthorityResolver.adapter.js";
import PostgresDirectiveRepository from "../../src/directives/infrastructure/persistence/PostgresDirectiveRepository.adapter.js";
import { createDatabaseClient } from "./postgres-client.js";

interface GrantRow {
	staff_id: string;
	identity_id: string;
	unit_id: string | null;
	office_id: string | null;
	assignment_id: string;
	role_name: string;
	capability: string;
	scope_type: "organization" | "unit" | "office";
	scope_unit_id: string | null;
	scope_office_id: string | null;
	valid_from: Date;
	valid_to: Date | null;
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(`Directive verification failed: ${message}`);
}

async function expectApplicationError(
	work: () => Promise<unknown>,
	errorCode: string,
	message: string,
) {
	try {
		await work();
	} catch (error) {
		assert(
			typeof error === "object" && error !== null &&
				"errorCode" in error && error.errorCode === errorCode,
			message,
		);
		return;
	}
	throw new Error(`Directive verification failed: ${message}`);
}

const client = createDatabaseClient();
let transactionOpen = false;

try {
	await client.connect();
	await client.query("BEGIN");
	transactionOpen = true;

	const authority = await client.query<{ staff_id: string }>(`
		SELECT DISTINCT staff.id AS staff_id
		FROM identity.staff staff
		JOIN identity.role_assignments assignment ON assignment.staff_id = staff.id
		JOIN identity.roles role ON role.id = assignment.role_id
		JOIN identity.role_permissions role_permission ON role_permission.role_id = role.id
		JOIN identity.permissions permission ON permission.id = role_permission.permission_id
		WHERE permission.code = 'directive.issue'
			AND staff.status = 'active'
			AND assignment.revoked_at IS NULL
			AND assignment.valid_from <= NOW()
			AND (assignment.valid_to IS NULL OR assignment.valid_to > NOW())
		ORDER BY staff.id
		LIMIT 1;
	`);
	assert(authority.rows[0], "no active directive authority fixture is available");

	const grantsResult = await client.query<GrantRow>(`
		SELECT staff.id AS staff_id, COALESCE(staff.identity_id, staff.id) AS identity_id,
			staff.unit_id, staff.office_id, assignment.id AS assignment_id,
			role.name AS role_name, permission.code AS capability,
			assignment.scope_type::TEXT, assignment.scope_unit_id, assignment.scope_office_id,
			assignment.valid_from, assignment.valid_to
		FROM identity.staff staff
		JOIN identity.role_assignments assignment ON assignment.staff_id = staff.id
		JOIN identity.roles role ON role.id = assignment.role_id
		JOIN identity.role_permissions role_permission ON role_permission.role_id = role.id
		JOIN identity.permissions permission ON permission.id = role_permission.permission_id
		WHERE staff.id = $1
			AND assignment.revoked_at IS NULL
			AND assignment.valid_from <= NOW()
			AND (assignment.valid_to IS NULL OR assignment.valid_to > NOW());
	`, [authority.rows[0].staff_id]);
	assert(grantsResult.rows.length > 0, "the directive authority has no active grants");

	const first = grantsResult.rows[0]!;
	const grants: ActorGrant[] = grantsResult.rows.map((row) => ({
		assignmentId: row.assignment_id,
		role: row.role_name,
		capability: row.capability,
		scope: row.scope_type === "organization"
			? { type: "organization", id: null }
			: row.scope_type === "unit"
				? { type: "unit", id: row.scope_unit_id! }
				: { type: "office", id: row.scope_office_id! },
		validFrom: row.valid_from,
		validTo: row.valid_to,
	}));
	const actor: ActorContext = {
		identityId: first.identity_id,
		staffId: first.staff_id,
		unitId: first.unit_id,
		officeId: first.office_id,
		grants,
	};
	for (const capability of [
		"directive.create", "directive.update", "directive.issue", "directive.view",
		"directive.route", "directive.acknowledge", "directive.enforce",
	]) {
		assert(grants.some((grant) => grant.capability === capability), `fixture lacks ${capability}`);
	}

	const mediaId = `MEDIA-SMOKE-${Date.now()}`;
	await client.query(`
		INSERT INTO media.media_assets
			(id, storage_provider, object_key, format, mime_type, size_bytes, checksum,
			 uploaded_at, uploaded_by, uploaded_by_type, is_active,
			 virus_scan_status, virus_scanned_at)
		VALUES ($1, 'verification', $2, 'txt', 'text/plain', 1, $3,
			NOW(), $4, 'staff', TRUE, 'clean', NOW());
	`, [mediaId, `directive-verification/${mediaId}.txt`, "0".repeat(64), actor.staffId]);

	const pool = client as unknown as PostgresDb;
	const transactionContext = { client: client as unknown as PoolClient };
	const transactionManager: TransactionManager = {
		execute: (work) => work(transactionContext),
	};
	const repository = new PostgresDirectiveRepository(pool);
	const commands = new DirectiveCommandService(
		repository,
		new PostgresDirectiveAudienceResolver(pool),
		new PostgresDirectiveAuthorityResolver(pool),
		transactionManager,
		new UuidV7Generator(),
	);

	let directive = await commands.create(actor, {
		referenceNumber: null,
		acknowledgementRequired: true,
		completionRequired: true,
		revision: {
			heading: "Directive application verification",
			instruction: "Verify the authoritative directive lifecycle",
			expectedOutcome: "All persistence and evidence checks pass",
			priority: "standard",
			registryVolume: "official",
			completionDueAt: null,
			sourceDocumentVersionId: null,
			targets: [{ type: "staff", staffId: actor.staffId }],
		},
	}, { requestId: "directive-verification-create" });
	assert(directive.status === "draft" && directive.version === 2, "draft creation did not establish revision 1");
	await expectApplicationError(
		() => commands.amend(actor, directive.id, 1, {
			changeReason: "Stale write must fail",
			revision: { ...directive.currentRevision!, targets: [{ type: "staff", staffId: actor.staffId }] },
		}),
		"stale_governance_decision",
		"stale directive amendment was not rejected",
	);

	directive = await commands.amend(actor, directive.id, directive.version, {
		changeReason: "Exercise immutable draft amendment",
		revision: {
			...directive.currentRevision!,
			heading: "Directive application verification, amended",
			targets: [{ type: "staff", staffId: actor.staffId }],
		},
	}, { requestId: "directive-verification-amend" });
	assert(directive.currentRevision?.revisionNumber === 2 && directive.version === 3, "draft amendment did not create revision 2");
	await client.query("SAVEPOINT immutable_revision_check");
	let immutableRevisionRejected = false;
	try {
		await client.query(
			"UPDATE directive.directive_revisions SET heading = 'mutated' WHERE id = $1;",
			[directive.currentRevision!.id],
		);
	} catch (error) {
		immutableRevisionRejected = typeof error === "object" && error !== null &&
			"code" in error && error.code === "55000";
		await client.query("ROLLBACK TO SAVEPOINT immutable_revision_check");
	}
	assert(immutableRevisionRejected, "issued revision immutability trigger did not reject mutation");

	directive = await commands.issue(actor, directive.id, directive.version, {
		referenceNumber: `VERIFY/${Date.now()}`,
		effectiveFrom: null,
		effectiveUntil: null,
	}, { requestId: "directive-verification-issue" });
	assert(directive.status === "issued" && directive.version === 4, "issuance failed");
	assert(directive.issuedUnderAssignmentId, "issuance authority was not snapshotted");
	assert(await repository.isRecipient(directive.currentRevisionId!, actor.staffId, transactionContext), "audience delivery was not resolved");
	await expectApplicationError(
		() => commands.complete(actor, directive.id, directive.version),
		"conflict",
		"completion without accepted evidence was not rejected",
	);

	const seen = await commands.markSeen(actor, directive.id, { requestId: "directive-verification-seen" });
	const seenAgain = await commands.markSeen(actor, directive.id, { requestId: "directive-verification-seen-again" });
	assert(!seen.alreadySeen && seenAgain.alreadySeen, "seen acknowledgement is not idempotent");
	const acknowledgement = await commands.acknowledge(actor, directive.id, "Received and understood", { requestId: "directive-verification-ack" });
	assert(acknowledgement.id.startsWith("DAK-"), "acknowledgement evidence was not created");
	await expectApplicationError(
		() => commands.acknowledge(actor, directive.id, "Duplicate acknowledgement"),
		"conflict",
		"duplicate acknowledgement was not rejected",
	);

	const completionEvidence = await commands.addEvidence(actor, directive.id, {
		documentVersionId: null,
		mediaAssetId: mediaId,
		description: "Transactional verification evidence",
	}, { requestId: "directive-verification-evidence" });
	await commands.acceptEvidence(actor, directive.id, completionEvidence.id, "Verified");
	const storedEvidence = await repository.listEvidence(directive.id);
	assert(storedEvidence.length === 1 && storedEvidence[0]!.acceptance, "completion evidence acceptance was not recorded");

	directive = (await repository.findById(directive.id, transactionContext))!;
	directive = await commands.complete(actor, directive.id, directive.version, { requestId: "directive-verification-complete" });
	assert(directive.status === "completed", "directive did not complete after accepted evidence");

	const history = await repository.listHistory(directive.id);
	for (const requiredType of ["revision_created", "issued", "delivered", "seen", "acknowledged", "completion_evidence_added", "completion_evidence_accepted", "completed"]) {
		assert(history.some((entry) => entry.type === requiredType), `history is missing ${requiredType}`);
	}
	for (let index = 1; index < history.length; index++) {
		assert(history[index - 1]!.occurredAt <= history[index]!.occurredAt, "history is not chronological");
	}

	const verifiedDirectiveId = directive.id;
	await client.query("ROLLBACK");
	transactionOpen = false;
	const persisted = await client.query<{ count: number }>(
		"SELECT COUNT(*)::INT AS count FROM directive.directives WHERE id = $1;",
		[verifiedDirectiveId],
	);
	assert(persisted.rows[0]?.count === 0, "verification transaction was not rolled back");

	console.log(JSON.stringify({
		verified: true,
		directiveId: verifiedDirectiveId,
		finalStatus: directive.status,
		finalVersion: directive.version,
		historyEntries: history.length,
		evidenceAccepted: Boolean(storedEvidence[0]!.acceptance),
		rolledBack: true,
	}, null, 2));
} finally {
	if (transactionOpen) await client.query("ROLLBACK").catch(() => undefined);
	await client.end().catch(() => undefined);
}
