import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import type { StaffClassificationRepositoryPort } from "../../../application/ports/repos/staff/StaffClassificationRepository.port.js";
import StaffClassification from "../../../domain/entities/staff/StaffClassification.js";

class PostgresStaffClassificationRepositoryAdapter implements StaffClassificationRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(
		staffClassification: StaffClassification,
	): Promise<StaffClassification> {
		const query =
			"insert into identity.staff_classsification values($1, $2, $3, $4, $5, $6, now()) returning *";

		const result = await this.dbPool.query(query, [
            staffClassification.id,
            staffClassification.staffId,
            staffClassification.capabilityClass,
            staffClassification.authorityLevel,
            staffClassification.effectiveFrom,
            staffClassification.effectiveTo
        ]);

        const newStaffClassification = result.rows[0];

        return new StaffClassification({
            id: newStaffClassification.id,
            staffId: newStaffClassification.staff_id,
            capabilityClass: newStaffClassification.capability_class,
            authorityLevel: newStaffClassification.authority_level,
            effectiveFrom: newStaffClassification.effective_from,
            effectiveTo: newStaffClassification.effective_to,
            createdAt: newStaffClassification.created_at,
        })
	}

    async updateStaffClassification(classificationId: string, changesToMake: Partial<StaffClassification>): Promise<StaffClassification> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (changesToMake.staffId !== undefined) {
            updates.push(`staff_id = $${paramCount++}`);
            values.push(changesToMake.staffId);
        }
        if (changesToMake.capabilityClass !== undefined) {
            updates.push(`capability_class = $${paramCount++}`);
            values.push(changesToMake.capabilityClass);
        }
        if (changesToMake.authorityLevel !== undefined) {
            updates.push(`authority_level = $${paramCount++}`);
            values.push(changesToMake.authorityLevel);
        }
        if (changesToMake.effectiveFrom !== undefined) {
            updates.push(`effective_from = $${paramCount++}`);
            values.push(changesToMake.effectiveFrom);
        }
        if (changesToMake.effectiveTo !== undefined) {
            updates.push(`effective_to = $${paramCount++}`);
            values.push(changesToMake.effectiveTo);
        }

        if (updates.length === 0) {
            return new StaffClassification({ id: classificationId } as any);
        }

        values.push(classificationId);

        const query = `UPDATE identity.staff_classsification SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;
        const result = await this.dbPool.query(query, values);

        const updatedClassification = result.rows[0];

        return new StaffClassification({
            id: updatedClassification.id,
            staffId: updatedClassification.staff_id,
            capabilityClass: updatedClassification.capability_class,
            authorityLevel: updatedClassification.authority_level,
            effectiveFrom: updatedClassification.effective_from,
            effectiveTo: updatedClassification.effective_to,
            createdAt: updatedClassification.created_at,
            updatedAt: updatedClassification.updated_at,
        });
    }

    async findMostRecentClassificationById(classificationId: string): Promise<StaffClassification | null> {
        try {
            const query = "select * from identity.staff_classification where id = $1"

            const result = await this.dbPool.query(query, [classificationId])
            
            const numberOfRecords = result.rows.length;
            if(numberOfRecords === 0) return null

            const staffClassFromDb = result.rows[numberOfRecords - 1];

            return new StaffClassification({
                id: staffClassFromDb.id,
                staffId: staffClassFromDb.staff_id,
                authorityLevel: staffClassFromDb.authority_level,
                capabilityClass: staffClassFromDb.capability_class,
                effectiveFrom: staffClassFromDb.effective_from,
                effectiveTo: staffClassFromDb.effective_to,
                createdAt: staffClassFromDb.created_at,
                updatedAt: staffClassFromDb.updated_at
            });
        } catch (error : any) {
              console.log("error fetching staff by id", error);

            throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
                category: Category.PERSISTENCE,
                message: error.message,
            });
        }
    }
}

export default PostgresStaffClassificationRepositoryAdapter;
