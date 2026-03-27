import type { PostgresDb } from "@fastify/postgres";

import { Category } from "../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { WorkflowAccessPort } from "../../../../shared/application/port/WorkflowStaffReportingPort.port.js";


class PostgresWorkflowAccessRepositoryAdapter implements WorkflowAccessPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async findActiveSupervisor(
		staffId: string,
	): Promise<{ supervisorId: string } | null> {
		try {
			const query = `
				SELECT supervisor_id
				FROM identity.staff_reporting_lines
				WHERE staff_id = $1
				  AND effective_from <= NOW()
				  AND (effective_to IS NULL OR effective_to >= NOW())
				ORDER BY
					CASE WHEN type = 'DELEGATED' THEN 0 ELSE 1 END,
					effective_from DESC
				LIMIT 1;
			`;

			const result = await this.dbPool.query(query, [staffId]);

			if (result.rows.length === 0) {
				return null;
			}

			return { supervisorId: result.rows[0].supervisor_id };
		} catch (error: any) {
			console.log("error fetching active supervisor", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findByHierarchy(
		staffId: string,
	): Promise<{ supervisorId: string } | null> {
		try {
			const query = `
				WITH staff_info AS (
					SELECT s.unit_id, s.office_id, d.hierarchy_level
					FROM identity.staff s
					INNER JOIN identity.designations d ON d.id = s.designation_id
					WHERE s.id = $1
				)
				SELECT s2.id AS supervisor_id
				FROM staff_info si
				INNER JOIN identity.staff s2
					ON (
						(si.unit_id IS NOT NULL AND s2.unit_id = si.unit_id)
						OR (si.unit_id IS NULL AND si.office_id IS NOT NULL AND s2.office_id = si.office_id)
					)
				INNER JOIN identity.designations d2 ON d2.id = s2.designation_id
				WHERE d2.hierarchy_level < si.hierarchy_level
				ORDER BY d2.hierarchy_level DESC
				LIMIT 1;
			`;

			const result = await this.dbPool.query(query, [staffId]);

			if (result.rows.length === 0) {
				return null;
			}

			return { supervisorId: result.rows[0].supervisor_id };
		} catch (error: any) {
			console.log("error fetching supervisor by hierarchy", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

    async findByRoleAndScope(
        role: string,
        scope: { unitId?: string; officeId?: string; }
    ): Promise<string[]> {
        try {
            const query = `
                SELECT ra.staff_id
                FROM identity.role_assignments ra
                INNER JOIN identity.roles r ON r.id = ra.role_id
                WHERE r.name = $1
                  AND ra.valid_from <= NOW()
                  AND (ra.valid_to IS NULL OR ra.valid_to >= NOW())
                  AND ($2::text IS NULL OR ra.scope ->> 'unitId' = $2)
                  AND ($3::text IS NULL OR ra.scope ->> 'officeId' = $3);
            `;

            const result = await this.dbPool.query(query, [
                role,
                scope.unitId ?? null,
                scope.officeId ?? null,
            ]);

            return result.rows.map((row) => row.staff_id);
        } catch (error: any) {
            console.log("error fetching role assignments by scope", error);

            const postgresError = mapPostgresError(error);

            throw new InfrastructureError(postgresError.summary, {
                category: Category.PERSISTENCE,
                message: postgresError.details?.message ?? error.message,
            });
        }
    }
}

export default PostgresWorkflowAccessRepositoryAdapter;
