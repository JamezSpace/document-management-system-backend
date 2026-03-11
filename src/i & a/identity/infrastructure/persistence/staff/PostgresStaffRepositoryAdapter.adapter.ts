import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { StaffRepositoryPort } from "../../../application/ports/repos/staff/StaffRepository.port.js";
import Staff from "../../../domain/entities/staff/Staff.js";
import type AbstractStaffDetails from "../../../domain/views/staff/AbstractStaffDetails.js";
import StaffDetailsWithMedia from "../../../domain/views/staff/StaffDetailsWithMedia.js";

class PostgresStaffRepositoryAdapter implements StaffRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async fetchAllStaffMembersByUnit(unitId: string): Promise<AbstractStaffDetails[]> {
		const query = "select * from identity.staff_details;";

		const result = await this.dbPool.query(query);
		
        let staffDetails: AbstractStaffDetails[] = [];
		result.rows.forEach((staffDetail) => {
			const preparedUnit = transformToCamelCase(staffDetail);

			staffDetails.push(staffDetail);
		});

		return staffDetails;
	}

	async findStaffByAuthProviderId(
		authProviderId: string,
	): Promise<Staff | null> {
        try {
            const query = 'select * from identity.staff where identity_id = $1'

            const result = await this.dbPool.query(query, [authProviderId]);

            if (result.rows.length === 0) {
                return null;
            }

            const staffData = result.rows[0];
            return new Staff({
                id: staffData.id,
                staffNumber: staffData.staff_number,
                employmentType: staffData.employment_type,
                status: staffData.status,
                designationId: staffData.designation_id,
                identityId: staffData.identity_id,
                officeId: staffData.office_id,
                unitId: staffData.unit_id,
                createdAt: staffData.created_at,
                createdBy: staffData.createdBy,
                activatedBy: staffData.activatedBy,
                activatedAt : staffData.activatedAt,
            });
        } catch (error: any) {
            console.log("error fetching staff by id", error);

            throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
                category: Category.PERSISTENCE,
                message: error.message,
            });
        }
    }

	async findStaffWithoutMediaById(staffId: string): Promise<Staff | null> {
        try {
            const query = "SELECT * FROM identity.staff WHERE id = $1";
            const result = await this.dbPool.query(query, [staffId]);

            if (result.rows.length === 0) {
                return null;
            }

            const staffData = result.rows[0];
            return new Staff({
                id: staffData.id,
                staffNumber: staffData.staff_number,
                employmentType: staffData.employment_type,
                status: staffData.status,
                designationId: staffData.designation_id,
                identityId: staffData.identity_id,
                officeId: staffData.office_id,
                unitId: staffData.unit_id,
                createdAt: staffData.created_at,
                createdBy: staffData.createdBy,
                activatedBy: staffData.activatedBy,
                activatedAt : staffData.activatedAt
            });
        } catch (error: any) {
            console.log("error fetching staff by id", error);

            throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
                category: Category.PERSISTENCE,
                message: error.message,
            });
        }
    }

	async findStaffWithMediaByIdentityId(identityId: string): Promise<StaffDetailsWithMedia | null> {
        try {
            const query = "SELECT * FROM identity.staff_details_with_media WHERE identity_id = $1";
            const result = await this.dbPool.query(query, [identityId]);

            if (result.rows.length === 0) {
                return null;
            }

            const staffData = result.rows[0];
            return new StaffDetailsWithMedia({
                id: staffData.id,
                staffNumber: staffData.staff_number,
                employmentType: staffData.employment_type,
                status: staffData.status,
                designation: staffData.designation,
                identityId: staffData.identity_id,
                office: staffData.office,
                unitName: staffData.unitName,
                unitSector: staffData.unitSector,
                assetRole: staffData.assetRole,
                bucketName: staffData.bucketName,
                storageProvider: staffData.storageProvider,
                objectKey: staffData.objectKey,
                createdAt: staffData.createdAt,
                createdBy: staffData.createdBy,
                activatedBy: staffData.activatedBy,
                activatedAt : staffData.activatedAt,
                updatedAt: staffData.updatedAt
            });
        } catch (error: any) {
            console.log("error fetching staff details by id", error);

            throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
                category: Category.PERSISTENCE,
                message: error.message,
            });
        }
    }

	async save(staff: Staff): Promise<Staff> {
		try {
			const query = `
                INSERT INTO identity.staff (id, identity_id, staff_number, employment_type, unit_id, office_id, designation_id, status, created_at) 
                VALUES ($1, $2, $3, $4,$5,$6,$7,$8, now())
                RETURNING *`;

			const result = await this.dbPool.query(query, [
				staff.getStaffId(),
				staff.identityId,
				staff.staffNumber,               
				staff.employmentType,               
				staff.unitId,               
				staff.officeId,               
				staff.designationId,               
				staff.status             
			]);

			const newStaff = result.rows[0];

			return new Staff({
				id: newStaff.id,
				staffNumber: newStaff.staff_number,
				employmentType: newStaff.employment_type,
                status: newStaff.status,
                designationId: newStaff.designation_id,
                identityId: newStaff.identity_id,
                officeId: newStaff.office_id,
                unitId: newStaff.unit_id,
				createdAt: newStaff.created_at,
                createdBy: newStaff.createdBy,
                activatedBy: newStaff.activatedBy,
                activatedAt : newStaff.activatedAt
			});
		} catch (error: any) {
			console.log("error in staff repo adapter", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.UNREGISTERED_ERROR, {
				category: Category.PERSISTENCE,
				message: error.message,
			});
		}
	}

	async updateStaff(
		staffId: string,
		changesToMake: Partial<Staff>,
	): Promise<Staff> {
    try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (changesToMake.staffNumber !== undefined) {
            updates.push(`staff_number = $${paramCount++}`);
            values.push(changesToMake.staffNumber);
        }
        if (changesToMake.employmentType !== undefined) {
            updates.push(`employment_type = $${paramCount++}`);
            values.push(changesToMake.employmentType);
        }
        if (changesToMake.unitId !== undefined) {
            updates.push(`unit_id = $${paramCount++}`);
            values.push(changesToMake.unitId);
        }
        if (changesToMake.officeId !== undefined) {
            updates.push(`office_id = $${paramCount++}`);
            values.push(changesToMake.officeId);
        }
        if (changesToMake.designationId !== undefined) {
            updates.push(`designation_id = $${paramCount++}`);
            values.push(changesToMake.designationId);
        }
        if (changesToMake.status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(changesToMake.status);
        }

        if (updates.length === 0) {
            return new Staff({ id: staffId } as any);
        }

        values.push(staffId);
        const query = `UPDATE identity.staff SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

        const result = await this.dbPool.query(query, values);

        if (result.rows.length === 0) {
            throw new InfrastructureError(GlobalInfrastructureErrors.persistence.NOT_FOUND, {
                category: Category.PERSISTENCE,
                message: "No staff record found for update",
            });
        }

        const updatedStaff = result.rows[0];

        return new Staff({
            id: updatedStaff.id,
            staffNumber: updatedStaff.staff_number,
            employmentType: updatedStaff.employment_type,
            status: updatedStaff.status,
            designationId: updatedStaff.designation_id,
            identityId: updatedStaff.identity_id,
            officeId: updatedStaff.office_id,
            unitId: updatedStaff.unit_id,
            createdAt: updatedStaff.created_at,
            createdBy: updatedStaff.createdBy,
                activatedBy: updatedStaff.activatedBy,
                activatedAt : updatedStaff.activatedAt
        });
    } catch (error: any) {
        console.log("error updating staff", error);
        throw new InfrastructureError(GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR, {
            category: Category.PERSISTENCE,
            message: error.message,
        });
    }
    }
}

export default PostgresStaffRepositoryAdapter;
