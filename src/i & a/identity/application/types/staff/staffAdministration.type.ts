import type { EmploymentType, Status } from "../../../domain/enum/staff.enum.js";

interface AdministrativeStaffRecord {
	staffId: string;
	identityId: string;
	revision: number;
	firstName: string;
	middleName: string | null;
	lastName: string;
	fullName: string;
	email: string;
	staffNumber: number;
	employmentType: EmploymentType;
	status: Status;
	unit: { id: string | null; name: string | null };
	office: { id: string | null; name: string | null };
	designation: { id: string | null; title: string | null };
	createdAt: Date;
	updatedAt: Date | null;
}

interface AdministrativeStaffListFilters {
	status?: Status;
	unitId?: string;
	search?: string;
	limit: number;
	offset: number;
}

interface AdministrativeStaffUpdate {
	staffNumber?: number;
	employmentType?: EmploymentType;
	unitId?: string;
	officeId?: string;
	designationId?: string;
}

export type {
	AdministrativeStaffListFilters,
	AdministrativeStaffRecord,
	AdministrativeStaffUpdate,
};
