import type { PostgresDb } from "@fastify/postgres";
import type { DirectiveAuthorityResolverPort } from "../../application/ports/DirectiveAuthorityResolver.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class PostgresDirectiveAuthorityResolver implements DirectiveAuthorityResolverPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async resolve(staffId: string, assignmentId: string, tx: TransactionContext) {
		const result = await tx.client.query(
			`SELECT staff.id AS staff_id, assignment.id AS assignment_id,
				staff.unit_id, staff.office_id,
				COALESCE(NULLIF(CONCAT_WS(' ', account.first_name, account.middle_name, account.last_name), ''),
					'Staff ' || staff.staff_number::TEXT) AS staff_name,
				designation.title AS designation_name,
				unit.full_name AS unit_name
			 FROM identity.role_assignments assignment
			 JOIN identity.staff staff ON staff.id = assignment.staff_id
			 LEFT JOIN identity.users account ON account.id = staff.identity_id
			 LEFT JOIN identity.designations designation ON designation.id = staff.designation_id
			 LEFT JOIN identity.organizational_units unit ON unit.id = staff.unit_id
			 WHERE assignment.id = $1 AND assignment.staff_id = $2
				AND assignment.revoked_at IS NULL
				AND assignment.valid_from <= NOW()
				AND (assignment.valid_to IS NULL OR assignment.valid_to > NOW())
				AND staff.status = 'active'
			 LIMIT 1;`,
			[assignmentId, staffId],
		);
		const row = result.rows[0];
		return row ? {
			staffId: row.staff_id,
			assignmentId: row.assignment_id,
			unitId: row.unit_id,
			officeId: row.office_id,
			name: row.staff_name,
			designation: row.designation_name,
			unitName: row.unit_name,
		} : null;
	}
}

export default PostgresDirectiveAuthorityResolver;
