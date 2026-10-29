import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { StaffAdministrationRepositoryPort } from "../../../../application/ports/repos/entities/staff/StaffAdministrationRepository.port.js";
import type { GovernedIdentityChangeField } from "../../../../application/types/user/selfService.type.js";
import type {
	AdministrativeStaffListFilters,
	AdministrativeStaffRecord,
	AdministrativeStaffUpdate,
} from "../../../../application/types/staff/staffAdministration.type.js";
import type { Status } from "../../../../domain/enum/staff.enum.js";

interface StaffAdministrationRow {
	staff_id: string;
	identity_id: string;
	revision: string | number;
	first_name: string;
	middle_name: string | null;
	last_name: string;
	email: string;
	staff_number: number;
	employment_type: AdministrativeStaffRecord["employmentType"];
	status: AdministrativeStaffRecord["status"];
	unit_id: string | null;
	unit_name: string | null;
	office_id: string | null;
	office_name: string | null;
	designation_id: string | null;
	designation_title: string | null;
	created_at: Date;
	updated_at: Date | null;
	total_count?: string | number;
}

const selectStaff = `
	SELECT
		s.id AS staff_id,
		s.identity_id,
		s.revision,
		u.first_name,
		u.middle_name,
		u.last_name,
		u.email,
		s.staff_number,
		s.employment_type,
		s.status,
		unit.id AS unit_id,
		unit.full_name AS unit_name,
		office.id AS office_id,
		office.name AS office_name,
		designation.id AS designation_id,
		designation.title AS designation_title,
		s.created_at,
		s.updated_at`;

const joins = `
	FROM identity.staff s
	JOIN identity.users u ON u.id = s.identity_id
	LEFT JOIN identity.organizational_units unit ON unit.id = s.unit_id
	LEFT JOIN identity.offices office ON office.id = s.office_id
	LEFT JOIN identity.designations designation ON designation.id = s.designation_id`;

class StaffAdministrationRepositoryAdapter
	implements StaffAdministrationRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async findById(staffId: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query<StaffAdministrationRow>(
			`${selectStaff} ${joins} WHERE s.id = $1 AND s.id <> 'staff.system' LIMIT 1`,
			[staffId],
		);
		return result.rows[0] ? this.map(result.rows[0]) : null;
	}

	async list(filters: AdministrativeStaffListFilters) {
		const conditions = ["s.id <> 'staff.system'", "s.status <> 'deleted'"];
		const values: unknown[] = [];
		if (filters.status) {
			values.push(filters.status);
			conditions.push(`s.status = $${values.length}`);
		}
		if (filters.unitId) {
			values.push(filters.unitId);
			conditions.push(`s.unit_id = $${values.length}`);
		}
		if (filters.search) {
			values.push(`%${filters.search.trim()}%`);
			conditions.push(`(
				u.first_name ILIKE $${values.length}
				OR u.middle_name ILIKE $${values.length}
				OR u.last_name ILIKE $${values.length}
				OR u.email ILIKE $${values.length}
				OR CAST(s.staff_number AS TEXT) ILIKE $${values.length}
			)`);
		}
		values.push(filters.limit, filters.offset);
		const result = await this.dbPool.query<StaffAdministrationRow>(
			`${selectStaff}, COUNT(*) OVER() AS total_count
			 ${joins}
			 WHERE ${conditions.join(" AND ")}
			 ORDER BY u.last_name, u.first_name, s.id
			 LIMIT $${values.length - 1} OFFSET $${values.length}`,
			values,
		);
		return {
			items: result.rows.map((row) => this.map(row)),
			total: Number(result.rows[0]?.total_count ?? 0),
		};
	}

	async updateDetails(
		staffId: string,
		changes: AdministrativeStaffUpdate,
		expectedRevision: number,
		tx: TransactionContext,
	) {
		const columnByField: Record<keyof AdministrativeStaffUpdate, string> = {
			staffNumber: "staff_number",
			employmentType: "employment_type",
			unitId: "unit_id",
			officeId: "office_id",
			designationId: "designation_id",
		};
		const entries = Object.entries(changes) as Array<
			[keyof AdministrativeStaffUpdate, AdministrativeStaffUpdate[keyof AdministrativeStaffUpdate]]
		>;
		const values: unknown[] = entries.map(([, value]) => value);
		const assignments = entries.map(
			([field], index) => `${columnByField[field]} = $${index + 1}`,
		);
		values.push(staffId, expectedRevision);
		const result = await tx.client.query(
			`UPDATE identity.staff
			 SET ${assignments.join(", ")}, revision = revision + 1, updated_at = NOW()
			 WHERE id = $${values.length - 1} AND revision = $${values.length}
			 RETURNING id`,
			values,
		);
		return result.rows.length > 0 ? this.findById(staffId, tx) : null;
	}

	async transitionStatus(
		staffId: string,
		toStatus: Status,
		expectedRevision: number,
		tx: TransactionContext,
	) {
		const result = await tx.client.query(
			`UPDATE identity.staff
			 SET status = $1, revision = revision + 1, updated_at = NOW()
			 WHERE id = $2 AND revision = $3
			 RETURNING id`,
			[toStatus, staffId, expectedRevision],
		);
		return result.rows.length > 0 ? this.findById(staffId, tx) : null;
	}

	async applyIdentityChange(
		identityId: string,
		field: Exclude<GovernedIdentityChangeField, "signature">,
		value: string | null,
		tx: TransactionContext,
	): Promise<number> {
		const columnByField: Record<Exclude<GovernedIdentityChangeField, "signature">, string> = {
			firstName: "first_name",
			middleName: "middle_name",
			lastName: "last_name",
			email: "email",
		};
		const result = await tx.client.query<{ revision: string }>(
			`UPDATE identity.users
			 SET ${columnByField[field]} = $1, revision = revision + 1, updated_at = NOW()
			 WHERE id = $2
			 RETURNING revision`,
			[value, identityId],
		);
		if (!result.rows[0]) throw new Error("Identity record not found while applying change");
		return Number(result.rows[0].revision);
	}

	async findAuthProviderId(identityId: string, tx: TransactionContext) {
		const result = await tx.client.query<{ auth_provider_id: string }>(
			`SELECT auth_provider_id FROM identity.users WHERE id = $1 LIMIT 1`,
			[identityId],
		);
		return result.rows[0]?.auth_provider_id ?? null;
	}

	private map(row: StaffAdministrationRow): AdministrativeStaffRecord {
		return {
			staffId: row.staff_id,
			identityId: row.identity_id,
			revision: Number(row.revision),
			firstName: row.first_name,
			middleName: row.middle_name,
			lastName: row.last_name,
			fullName: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
			email: row.email,
			staffNumber: row.staff_number,
			employmentType: row.employment_type,
			status: row.status,
			unit: { id: row.unit_id, name: row.unit_name },
			office: { id: row.office_id, name: row.office_name },
			designation: { id: row.designation_id, title: row.designation_title },
			createdAt: new Date(row.created_at),
			updatedAt: row.updated_at ? new Date(row.updated_at) : null,
		};
	}
}

export default StaffAdministrationRepositoryAdapter;
