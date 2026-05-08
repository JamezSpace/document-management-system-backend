import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { OfficeDesignationRepositoryPort } from "../../../../application/ports/repos/entities/office/OfficeDesignationRepository.port.js";
import OfficeDesignation from "../../../../domain/entities/office/OfficeDesignation.js";

class PostgresOfficeDesignationRepositoryAdapter implements OfficeDesignationRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(designation: OfficeDesignation): Promise<OfficeDesignation> {
		try {
			const result = await this.dbPool.query(
				"INSERT INTO identity.designations VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
				[
					designation.getOfficeDesignationId(),
					designation.title,
					designation.description,
					designation.hierarchyLevel,
					designation.officeId,
					designation.createdAt,
				],
			);

			const dbOfficeDesignation = result.rows[0];

			return new OfficeDesignation({
				id: dbOfficeDesignation.id,
				title: dbOfficeDesignation.title,
				description: dbOfficeDesignation.description,
				hierarchyLevel: dbOfficeDesignation.hierarchy_level,
				officeId: dbOfficeDesignation.office_id,
				createdAt: dbOfficeDesignation.created_at,
				updatedAt: dbOfficeDesignation.updated_at,
			});
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findOfficeDesignationById(
		id: string,
        tx?: TransactionContext
	): Promise<OfficeDesignation | null> {
        const executor = tx?.client ?? this.dbPool

		const result = await executor.query(
			"SELECT * FROM identity.designations WHERE id = $1",
			[id],
		);

		const dbOfficeDesignation = result.rows[0];

		if (!dbOfficeDesignation) return null;

		return new OfficeDesignation({
			id: dbOfficeDesignation.id,
			title: dbOfficeDesignation.title,
			description: dbOfficeDesignation.description,
			hierarchyLevel: dbOfficeDesignation.hierarchy_level,
			officeId: dbOfficeDesignation.office_id,
			createdAt: dbOfficeDesignation.created_at,
			updatedAt: dbOfficeDesignation.updated_at,
		});
	}

	async fetchAll(): Promise<OfficeDesignation[]> {
		const result = await this.dbPool.query(
			"SELECT * FROM identity.designations ORDER BY office_id;",
		);

		const allDesignations: OfficeDesignation[] = [];

		result.rows.forEach((designation) => {
			const designationObj = new OfficeDesignation({
				id: designation.id,
				title: designation.title,
				description: designation.description,
				hierarchyLevel: designation.hierarchy_level,
				officeId: designation.office_id,
				createdAt: designation.created_at,
				updatedAt: designation.updated_at,
			});

			allDesignations.push(designationObj);
		});

		return allDesignations;
	}

	async fetchAllDesignationsWithinAnOffice(officeId: string): Promise<{
		officeName: string;
		designations: OfficeDesignation[];
	}> {
		const result = await this.dbPool.query(
			`SELECT desig.*, office.name as office_name
            FROM identity.designations desig
            JOIN identity.offices office
            ON desig.office_id = office.id
            WHERE office_id = $1;`,
			[officeId],
		);

		const designations: OfficeDesignation[] = [];
		let officeName: string = "";

			result.rows.forEach((desig) => {
            officeName = desig.office_name;
            const { office_name, ...designationData } = desig;
            designations.push(new OfficeDesignation({
                id: designationData.id,
                title: designationData.title,
                description: designationData.description,
                hierarchyLevel: designationData.hierarchy_level,
                officeId: designationData.office_id,
                createdAt: designationData.created_at,
                updatedAt: designationData.updated_at,
            }));
		});

		return {
			officeName,
			designations,
		};
	}
}

export default PostgresOfficeDesignationRepositoryAdapter;
