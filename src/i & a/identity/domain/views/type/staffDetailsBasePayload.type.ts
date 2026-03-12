import type { EmploymentType, Status } from "../../enum/staff.enum.js";

interface StaffDetailsBasePayload {
	id: string;
    authProviderId: string;
	identityId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
	staffNumber: number;
	employmentType: EmploymentType;
	unitSector: string;
	unitName: string;
	office: string;
	designation: string;
	status: Status;
    createdAt: Date;
    createdBy: string;
    activatedBy: string;
    activatedAt: Date;
    updatedAt: Date;
}

export type {StaffDetailsBasePayload};