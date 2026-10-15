import type { PostgresDb } from "@fastify/postgres";
import type { DirectiveAudienceResolverPort } from "../../application/ports/DirectiveAudienceResolver.port.js";
import type { ResolvedDirectiveAudienceMember } from "../../domain/directive.models.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

interface AudienceRow {
	staff_id: string;
	target_type: "staff" | "unit" | "office" | "role";
	target_id: string;
}

class PostgresDirectiveAudienceResolver implements DirectiveAudienceResolverPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async resolve(directiveRevisionId: string, tx: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query<AudienceRow>(
			`SELECT target.staff_id, target.target_type, target.target_id
			 FROM (
				SELECT staff.id AS staff_id, 'staff'::TEXT AS target_type, target.id AS target_id
				FROM directive.directive_revision_staff_targets target
				JOIN identity.staff staff ON staff.id = target.staff_id AND staff.status = 'active'
				WHERE target.directive_revision_id = $1
				UNION ALL
				SELECT staff.id, 'unit', target.id
				FROM directive.directive_revision_unit_targets target
				JOIN identity.staff staff ON staff.unit_id = target.unit_id AND staff.status = 'active'
				WHERE target.directive_revision_id = $1
				UNION ALL
				SELECT staff.id, 'office', target.id
				FROM directive.directive_revision_office_targets target
				JOIN identity.staff staff ON staff.office_id = target.office_id AND staff.status = 'active'
				WHERE target.directive_revision_id = $1
				UNION ALL
				SELECT staff.id, 'role', target.id
				FROM directive.directive_revision_role_targets target
				JOIN identity.role_assignments assignment ON assignment.role_id = target.role_id
					AND assignment.revoked_at IS NULL
					AND assignment.valid_from <= NOW()
					AND (assignment.valid_to IS NULL OR assignment.valid_to > NOW())
				JOIN identity.staff staff ON staff.id = assignment.staff_id AND staff.status = 'active'
				WHERE target.directive_revision_id = $1
					AND (
						(target.scope_type = 'organization')
						OR (target.scope_type = 'unit' AND staff.unit_id = target.scope_unit_id
							AND (assignment.scope_type = 'organization'
								OR (assignment.scope_type = 'unit' AND assignment.scope_unit_id = target.scope_unit_id)))
						OR (target.scope_type = 'office' AND staff.office_id = target.scope_office_id
							AND (assignment.scope_type = 'organization'
								OR (assignment.scope_type = 'unit' AND assignment.scope_unit_id = staff.unit_id)
								OR (assignment.scope_type = 'office' AND assignment.scope_office_id = target.scope_office_id)))
					)
			) target
			 ORDER BY target.staff_id, target.target_type, target.target_id;`,
			[directiveRevisionId],
		);

		const members = new Map<string, ResolvedDirectiveAudienceMember>();
		for (const row of result.rows) {
			const member = members.get(row.staff_id) ?? { staffId: row.staff_id, sources: [] };
			member.sources.push({ type: row.target_type, targetId: row.target_id });
			members.set(row.staff_id, member);
		}
		return [...members.values()];
	}
}

export default PostgresDirectiveAudienceResolver;
