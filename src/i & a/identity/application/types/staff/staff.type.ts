import type {
	EmploymentType,
	Status,
} from "../../../domain/enum/staff.enum.js";

interface StaffTypeForCreation {
	identityId: string;
	staffNumber: number;
	employmentType: EmploymentType;
	unitId: string;
	officeId: string;
	designationId: string;
	status: Status;
	createdAt?: Date;
	createdBy: string;
	activatedBy?: string;
	activatedAt?: Date;
	updatedAt?: Date;
}

interface RegisterStaffPayload {
	// personal Information
	firstName: string;
	lastName: string;
	middleName: string;
	email: string;
	phoneNumber: string;

	// professional Details
	staffNumber: number;
	employmentType: EmploymentType;
	unitId: string;
	officeId: string;
	designationId: string;

	// registrar information
	createdBy: string;
}

export type { RegisterStaffPayload, StaffTypeForCreation };
