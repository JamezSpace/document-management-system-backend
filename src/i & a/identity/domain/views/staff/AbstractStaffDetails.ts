import type { EmploymentType, Status } from "../../enum/staff.enum.js";
import type { StaffDetailsBasePayload } from "../type/staffDetailsBasePayload.type.js";


abstract class AbstractStaffDetails {
    protected readonly id: string;
	readonly identityId: string;
	readonly staffNumber: number;
	readonly employmentType: EmploymentType;
	readonly unitSector: string;
	readonly unitName: string;
	readonly office: string;
	readonly designation: string;
	status: Status;
    readonly createdAt: Date;
    readonly createdBy: string;
    readonly activatedBy: string;
    readonly activatedAt: Date;
    readonly updatedAt?: Date | undefined;

    constructor(payload: StaffDetailsBasePayload) {
		this.id = payload.id;
		this.identityId = payload.identityId;
		this.staffNumber = payload.staffNumber;
		this.employmentType = payload.employmentType;
		this.unitSector = payload.unitSector;
		this.unitName = payload.unitName;
		this.office = payload.office;
		this.designation = payload.designation;
		this.status = payload.status;
        this.createdBy = payload.createdBy;
        this.activatedBy = payload.activatedBy;

        this.createdAt = payload.createdAt;
        this.activatedAt = payload.activatedAt;
		this.updatedAt = payload.updatedAt;
    }

    getStaffId() {
		return this.id;
	}
}

export default AbstractStaffDetails;