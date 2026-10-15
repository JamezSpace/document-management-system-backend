import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	Directive,
	DirectiveCompletionEvidence,
	DirectiveHistoryEntry,
	DirectiveTarget,
} from "../../domain/directive.models.js";
import type {
	DirectiveRepositoryPort,
	DirectiveVisibilityScope,
} from "../../application/ports/DirectiveRepository.port.js";

const directiveSelect = `
	SELECT d.id, d.reference_number, d.status::TEXT, d.current_revision_id,
		d.issued_by_staff_id, d.issued_under_assignment_id,
		d.issuing_unit_id, d.issuing_office_id,
		d.issuer_name_snapshot, d.issuer_designation_snapshot, d.issuer_unit_name_snapshot,
		d.issued_at, d.effective_from, d.effective_until,
		d.acknowledgement_required, d.completion_required,
		d.completed_at, d.completed_by_staff_id,
		d.withdrawn_at, d.withdrawn_by_staff_id, d.withdrawal_reason,
		d.version, d.created_at, d.updated_at,
		r.id AS revision_id, r.revision_number, r.heading, r.instruction,
		r.expected_outcome, r.priority::TEXT, r.registry_volume::TEXT,
		r.completion_due_at, r.source_document_version_id, r.content_sha256,
		r.supersedes_revision_id, r.change_reason,
		r.created_by_staff_id AS revision_created_by, r.created_at AS revision_created_at
	FROM directive.directives d
	LEFT JOIN directive.directive_revisions r ON r.id = d.current_revision_id`;

class PostgresDirectiveRepository implements DirectiveRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async createDraft(input: Parameters<DirectiveRepositoryPort["createDraft"]>[0], tx: TransactionContext) {
		await tx.client.query(
			`INSERT INTO directive.directives
				(id, reference_number, issuing_unit_id, issuing_office_id,
				 acknowledgement_required, completion_required, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7);`,
			[input.id, input.referenceNumber, input.issuingUnitId, input.issuingOfficeId,
				input.acknowledgementRequired, input.completionRequired, input.createdAt],
		);
	}

	async createRevision(input: Parameters<DirectiveRepositoryPort["createRevision"]>[0], tx: TransactionContext) {
		await tx.client.query(
			`INSERT INTO directive.directive_revisions
				(id, directive_id, revision_number, heading, instruction, expected_outcome,
				 priority, registry_volume, completion_due_at, source_document_version_id,
				 content_sha256, supersedes_revision_id, change_reason, created_by_staff_id, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15);`,
			[input.id, input.directiveId, input.revisionNumber, input.revision.heading,
				input.revision.instruction, input.revision.expectedOutcome, input.revision.priority,
				input.revision.registryVolume, input.revision.completionDueAt,
				input.revision.sourceDocumentVersionId, input.contentSha256,
				input.supersedesRevisionId, input.changeReason, input.createdByStaffId, input.createdAt],
		);
	}

	async createTargets(revisionId: string, targets: Parameters<DirectiveRepositoryPort["createTargets"]>[1], createdBy: string, createdAt: Date, tx: TransactionContext) {
		for (const { id, target } of targets) {
			switch (target.type) {
				case "staff":
					await tx.client.query(`INSERT INTO directive.directive_revision_staff_targets (id,directive_revision_id,staff_id,created_by_staff_id,created_at) VALUES ($1,$2,$3,$4,$5);`, [id, revisionId, target.staffId, createdBy, createdAt]);
					break;
				case "unit":
					await tx.client.query(`INSERT INTO directive.directive_revision_unit_targets (id,directive_revision_id,unit_id,created_by_staff_id,created_at) VALUES ($1,$2,$3,$4,$5);`, [id, revisionId, target.unitId, createdBy, createdAt]);
					break;
				case "office":
					await tx.client.query(`INSERT INTO directive.directive_revision_office_targets (id,directive_revision_id,office_id,created_by_staff_id,created_at) VALUES ($1,$2,$3,$4,$5);`, [id, revisionId, target.officeId, createdBy, createdAt]);
					break;
				case "role":
					await tx.client.query(`INSERT INTO directive.directive_revision_role_targets (id,directive_revision_id,role_id,scope_type,scope_unit_id,scope_office_id,created_by_staff_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`, [id, revisionId, target.roleId, target.scopeType, target.scopeUnitId, target.scopeOfficeId, createdBy, createdAt]);
			}
		}
	}

	async setCurrentRevision(directiveId: string, revisionId: string, expectedVersion: number, updatedAt: Date, tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE directive.directives SET current_revision_id=$2, version=version+1, updated_at=$4
			 WHERE id=$1 AND version=$3;`,
			[directiveId, revisionId, expectedVersion, updatedAt],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async findById(id: string, tx?: TransactionContext, forUpdate = false): Promise<Directive | null> {
		try {
			const executor = tx?.client ?? this.dbPool;
			const lock = forUpdate ? " FOR UPDATE OF d" : "";
			const result = await executor.query(`${directiveSelect} WHERE d.id=$1${lock};`, [id]);
			if (!result.rows[0]) return null;
			const targets = result.rows[0].revision_id
				? await this.listTargets(result.rows[0].revision_id, tx)
				: [];
			return this.toDirective(result.rows[0], targets);
		} catch (error) { throw this.persistenceError(error); }
	}

	async list(scope: DirectiveVisibilityScope, filter: Parameters<DirectiveRepositoryPort["list"]>[1]) {
		try {
			const values: unknown[] = [scope.staffId];
			const visibility = scope.organization ? "TRUE" : `(
				d.issued_by_staff_id=$1
				OR EXISTS (SELECT 1 FROM directive.directive_deliveries delivery WHERE delivery.directive_revision_id=d.current_revision_id AND delivery.staff_id=$1)
				OR d.issuing_unit_id = ANY($2::VARCHAR[])
				OR d.issuing_office_id = ANY($3::VARCHAR[])
			)`;
			if (!scope.organization) values.push(scope.unitIds, scope.officeIds);
			const clauses = [visibility];
			if (filter.status) { values.push(filter.status); clauses.push(`d.status=$${values.length}`); }
			if (filter.search) { values.push(`%${filter.search}%`); clauses.push(`(d.reference_number ILIKE $${values.length} OR r.heading ILIKE $${values.length})`); }
			values.push(filter.limit);
			const result = await this.dbPool.query(
				`SELECT d.id FROM directive.directives d
				 LEFT JOIN directive.directive_revisions r ON r.id=d.current_revision_id
				 WHERE ${clauses.join(" AND ")}
				 ORDER BY COALESCE(d.issued_at,d.created_at) DESC,d.id DESC
				 LIMIT $${values.length};`, values,
			);
			const directives = await Promise.all(result.rows.map((row) => this.findById(row.id)));
			return directives.filter((item): item is Directive => item !== null);
		} catch (error) { throw this.persistenceError(error); }
	}

	async isRecipient(revisionId: string, staffId: string, tx?: TransactionContext) {
		const result = await (tx?.client ?? this.dbPool).query(
			`SELECT 1 FROM directive.directive_deliveries WHERE directive_revision_id=$1 AND staff_id=$2 LIMIT 1;`,
			[revisionId, staffId],
		);
		return Boolean(result.rows[0]);
	}

	async issue(input: Parameters<DirectiveRepositoryPort["issue"]>[0], tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE directive.directives SET
				reference_number=$3,status='issued',issued_by_staff_id=$4,
				issued_under_assignment_id=$5,issuing_unit_id=$6,issuing_office_id=$7,
				issuer_name_snapshot=$8,issuer_designation_snapshot=$9,issuer_unit_name_snapshot=$10,
				issued_at=$11,effective_from=$12,effective_until=$13,
				version=version+1,updated_at=$11
			 WHERE id=$1 AND version=$2 AND status='draft';`,
			[input.directiveId, input.expectedVersion, input.referenceNumber,
				input.authority.staffId, input.authority.assignmentId, input.authority.unitId,
				input.authority.officeId, input.authority.name, input.authority.designation,
				input.authority.unitName, input.issuedAt, input.effectiveFrom, input.effectiveUntil],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async createDeliveries(revisionId: string, members: Parameters<DirectiveRepositoryPort["createDeliveries"]>[1], deliveredAt: Date, tx: TransactionContext) {
		for (const member of members) {
			await tx.client.query(`INSERT INTO directive.directive_deliveries (id,directive_revision_id,staff_id,delivered_at) VALUES ($1,$2,$3,$4);`, [member.deliveryId, revisionId, member.staffId, deliveredAt]);
			for (let index = 0; index < member.sources.length; index++) {
				const source = member.sources[index]!;
				const columns = { staff: "staff_target_id", unit: "unit_target_id", office: "office_target_id", role: "role_target_id" } as const;
				await tx.client.query(
					`INSERT INTO directive.directive_delivery_sources (id,directive_revision_id,delivery_id,${columns[source.type]},created_at) VALUES ($1,$2,$3,$4,$5);`,
					[member.sourceIds[index], revisionId, member.deliveryId, source.targetId, deliveredAt],
				);
			}
		}
	}

	async withdraw(input: Parameters<DirectiveRepositoryPort["withdraw"]>[0], tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE directive.directives SET status='withdrawn',withdrawn_at=$4,
				withdrawn_by_staff_id=$3,withdrawal_reason=$5,version=version+1,updated_at=$4
			 WHERE id=$1 AND version=$2 AND status='issued';`,
			[input.directiveId, input.expectedVersion, input.staffId, input.occurredAt, input.reason],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async complete(input: Parameters<DirectiveRepositoryPort["complete"]>[0], tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE directive.directives SET status='completed',completed_at=$4,
				completed_by_staff_id=$3,version=version+1,updated_at=$4
			 WHERE id=$1 AND version=$2 AND status='issued';`,
			[input.directiveId, input.expectedVersion, input.staffId, input.occurredAt],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async markSeen(revisionId: string, staffId: string, seenAt: Date, tx: TransactionContext) {
		const result = await tx.client.query(
			`UPDATE directive.directive_deliveries SET seen_at=$3
			 WHERE directive_revision_id=$1 AND staff_id=$2 AND seen_at IS NULL;`,
			[revisionId, staffId, seenAt],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async acknowledge(input: Parameters<DirectiveRepositoryPort["acknowledge"]>[0], tx: TransactionContext) {
		const result = await tx.client.query(
			`INSERT INTO directive.directive_acknowledgements
				(id,directive_revision_id,delivery_id,staff_id,statement_snapshot,acknowledged_at)
			 SELECT $1::VARCHAR,$2::VARCHAR,delivery.id,$3::VARCHAR,$4::TEXT,$5::TIMESTAMPTZ
			 FROM directive.directive_deliveries delivery
			 WHERE delivery.directive_revision_id=$2::VARCHAR AND delivery.staff_id=$3::VARCHAR
			 ON CONFLICT (delivery_id) DO NOTHING;`,
			[input.id, input.directiveRevisionId, input.staffId, input.statement, input.acknowledgedAt],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async appendEvent(input: Parameters<DirectiveRepositoryPort["appendEvent"]>[0], tx: TransactionContext) {
		await tx.client.query(
			`INSERT INTO directive.directive_events
				(id,directive_id,directive_revision_id,event_type,actor_type,actor_staff_id,
				 actor_assignment_id,correlation_id,metadata,occurred_at)
			 VALUES ($1,$2,$3,$4,'staff',$5,$6,$7,$8,$9);`,
			[input.id, input.directiveId, input.directiveRevisionId, input.eventType,
				input.actorStaffId, input.actorAssignmentId, input.correlationId,
				JSON.stringify(input.metadata), input.occurredAt],
		);
	}

	async listHistory(directiveId: string): Promise<DirectiveHistoryEntry[]> {
		const revisions = await this.dbPool.query(`SELECT id,directive_id,revision_number,created_by_staff_id,created_at,change_reason,content_sha256 FROM directive.directive_revisions WHERE directive_id=$1`, [directiveId]);
		const events = await this.dbPool.query(
			`SELECT id,directive_revision_id,event_type::TEXT,actor_staff_id,metadata,occurred_at
			 FROM directive.directive_events
			 WHERE directive_id=$1
				AND event_type NOT IN (
					'revision_created', 'delivered', 'seen', 'acknowledged',
					'completion_evidence_added'
				);`,
			[directiveId],
		);
		const deliveries = await this.dbPool.query(`SELECT delivery.id,delivery.directive_revision_id,delivery.staff_id,delivery.delivered_at,delivery.seen_at,ack.id AS acknowledgement_id,ack.acknowledged_at FROM directive.directive_deliveries delivery JOIN directive.directive_revisions revision ON revision.id=delivery.directive_revision_id LEFT JOIN directive.directive_acknowledgements ack ON ack.delivery_id=delivery.id WHERE revision.directive_id=$1`, [directiveId]);
		const evidence = await this.dbPool.query(`SELECT evidence.id,evidence.directive_revision_id,evidence.submitted_by_staff_id,evidence.submitted_at,acceptance.id AS acceptance_id,acceptance.accepted_by_staff_id,acceptance.accepted_at FROM directive.directive_completion_evidence evidence LEFT JOIN directive.directive_completion_evidence_acceptances acceptance ON acceptance.evidence_id=evidence.id WHERE evidence.directive_id=$1`, [directiveId]);
		const entries: DirectiveHistoryEntry[] = [];
		for (const row of revisions.rows) entries.push({ id: row.id, type: "revision_created", occurredAt: row.created_at, actorStaffId: row.created_by_staff_id, revisionId: row.id, details: { revisionNumber: row.revision_number, changeReason: row.change_reason, contentSha256: row.content_sha256 } });
		for (const row of events.rows) entries.push({ id: row.id, type: row.event_type, occurredAt: row.occurred_at, actorStaffId: row.actor_staff_id, revisionId: row.directive_revision_id, details: row.metadata ?? {} });
		for (const row of deliveries.rows) {
			entries.push({ id: row.id, type: "delivered", occurredAt: row.delivered_at, actorStaffId: null, revisionId: row.directive_revision_id, details: { recipientStaffId: row.staff_id } });
			if (row.seen_at) entries.push({ id: `${row.id}:seen`, type: "seen", occurredAt: row.seen_at, actorStaffId: row.staff_id, revisionId: row.directive_revision_id, details: {} });
			if (row.acknowledgement_id) entries.push({ id: row.acknowledgement_id, type: "acknowledged", occurredAt: row.acknowledged_at, actorStaffId: row.staff_id, revisionId: row.directive_revision_id, details: {} });
		}
		for (const row of evidence.rows) {
			entries.push({ id: row.id, type: "completion_evidence_added", occurredAt: row.submitted_at, actorStaffId: row.submitted_by_staff_id, revisionId: row.directive_revision_id, details: {} });
			if (row.acceptance_id) entries.push({ id: row.acceptance_id, type: "completion_evidence_accepted", occurredAt: row.accepted_at, actorStaffId: row.accepted_by_staff_id, revisionId: row.directive_revision_id, details: { evidenceId: row.id } });
		}
		return entries.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime() || left.id.localeCompare(right.id));
	}

	async addEvidence(input: Parameters<DirectiveRepositoryPort["addEvidence"]>[0], tx: TransactionContext) {
		await tx.client.query(
			`INSERT INTO directive.directive_completion_evidence
				(id,directive_id,directive_revision_id,document_version_id,media_asset_id,
				 description,submitted_by_staff_id,submitted_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`,
			[input.id, input.directiveId, input.directiveRevisionId, input.documentVersionId,
				input.mediaAssetId, input.description, input.submittedByStaffId, input.submittedAt],
		);
	}

	async listEvidence(directiveId: string): Promise<DirectiveCompletionEvidence[]> {
		const result = await this.dbPool.query(
			`SELECT evidence.*, acceptance.id AS acceptance_id,
				acceptance.accepted_by_staff_id,acceptance.accepted_at,acceptance.note AS acceptance_note
			 FROM directive.directive_completion_evidence evidence
			 LEFT JOIN directive.directive_completion_evidence_acceptances acceptance ON acceptance.evidence_id=evidence.id
			 WHERE evidence.directive_id=$1 ORDER BY evidence.submitted_at DESC,evidence.id DESC;`,
			[directiveId],
		);
		return result.rows.map((row) => ({
			id: row.id, directiveId: row.directive_id, directiveRevisionId: row.directive_revision_id,
			documentVersionId: row.document_version_id, mediaAssetId: row.media_asset_id,
			description: row.description, submittedByStaffId: row.submitted_by_staff_id,
			submittedAt: row.submitted_at,
			acceptance: row.acceptance_id ? { id: row.acceptance_id, acceptedByStaffId: row.accepted_by_staff_id, acceptedAt: row.accepted_at, note: row.acceptance_note } : null,
		}));
	}

	async acceptEvidence(input: Parameters<DirectiveRepositoryPort["acceptEvidence"]>[0], tx: TransactionContext) {
		const result = await tx.client.query(
			`INSERT INTO directive.directive_completion_evidence_acceptances
				(id,evidence_id,accepted_by_staff_id,accepted_at,note)
			 VALUES ($1,$2,$3,$4,$5) ON CONFLICT (evidence_id) DO NOTHING;`,
			[input.id, input.evidenceId, input.acceptedByStaffId, input.acceptedAt, input.note],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async hasAcceptedEvidence(directiveId: string, tx: TransactionContext) {
		const result = await tx.client.query(
			`SELECT 1 FROM directive.directive_completion_evidence evidence
			 JOIN directive.directive_completion_evidence_acceptances acceptance ON acceptance.evidence_id=evidence.id
			 WHERE evidence.directive_id=$1 LIMIT 1;`, [directiveId],
		);
		return Boolean(result.rows[0]);
	}

	private async listTargets(revisionId: string, tx?: TransactionContext): Promise<DirectiveTarget[]> {
		const result = await (tx?.client ?? this.dbPool).query(
			`SELECT 'staff'::TEXT AS type,staff_id,NULL::VARCHAR AS unit_id,NULL::VARCHAR AS office_id,NULL::VARCHAR AS role_id,NULL::TEXT AS scope_type,NULL::VARCHAR AS scope_unit_id,NULL::VARCHAR AS scope_office_id FROM directive.directive_revision_staff_targets WHERE directive_revision_id=$1
			 UNION ALL SELECT 'unit',NULL,unit_id,NULL,NULL,NULL,NULL,NULL FROM directive.directive_revision_unit_targets WHERE directive_revision_id=$1
			 UNION ALL SELECT 'office',NULL,NULL,office_id,NULL,NULL,NULL,NULL FROM directive.directive_revision_office_targets WHERE directive_revision_id=$1
			 UNION ALL SELECT 'role',NULL,NULL,NULL,role_id,scope_type::TEXT,scope_unit_id,scope_office_id FROM directive.directive_revision_role_targets WHERE directive_revision_id=$1;`,
			[revisionId],
		);
		return result.rows.map((row): DirectiveTarget => {
			if (row.type === "staff") return { type: "staff", staffId: row.staff_id };
			if (row.type === "unit") return { type: "unit", unitId: row.unit_id };
			if (row.type === "office") return { type: "office", officeId: row.office_id };
			return { type: "role", roleId: row.role_id, scopeType: row.scope_type, scopeUnitId: row.scope_unit_id, scopeOfficeId: row.scope_office_id };
		});
	}

	private toDirective(row: any, targets: DirectiveTarget[]): Directive {
		return {
			id: row.id, referenceNumber: row.reference_number, status: row.status,
			currentRevisionId: row.current_revision_id,
			currentRevision: row.revision_id ? {
				id: row.revision_id, directiveId: row.id, revisionNumber: Number(row.revision_number),
				heading: row.heading, instruction: row.instruction, expectedOutcome: row.expected_outcome,
				priority: row.priority, registryVolume: row.registry_volume,
				completionDueAt: row.completion_due_at, sourceDocumentVersionId: row.source_document_version_id,
				contentSha256: row.content_sha256, supersedesRevisionId: row.supersedes_revision_id,
				changeReason: row.change_reason, createdByStaffId: row.revision_created_by,
				createdAt: row.revision_created_at, targets,
			} : null,
			issuedByStaffId: row.issued_by_staff_id, issuedUnderAssignmentId: row.issued_under_assignment_id,
			issuingUnitId: row.issuing_unit_id, issuingOfficeId: row.issuing_office_id,
			issuerNameSnapshot: row.issuer_name_snapshot, issuerDesignationSnapshot: row.issuer_designation_snapshot,
			issuerUnitNameSnapshot: row.issuer_unit_name_snapshot, issuedAt: row.issued_at,
			effectiveFrom: row.effective_from, effectiveUntil: row.effective_until,
			acknowledgementRequired: row.acknowledgement_required, completionRequired: row.completion_required,
			completedAt: row.completed_at, completedByStaffId: row.completed_by_staff_id,
			withdrawnAt: row.withdrawn_at, withdrawnByStaffId: row.withdrawn_by_staff_id,
			withdrawalReason: row.withdrawal_reason, version: Number(row.version),
			createdAt: row.created_at, updatedAt: row.updated_at,
		};
	}

	private persistenceError(error: unknown) {
		return new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
			category: Category.PERSISTENCE,
			message: error instanceof Error ? error.message : String(error),
			cause: error,
		});
	}
}

export default PostgresDirectiveRepository;
