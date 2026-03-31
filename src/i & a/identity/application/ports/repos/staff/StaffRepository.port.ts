import type Staff from "../../../../domain/entities/staff/Staff.js";
import type AbstractStaffDetails from "../../../../domain/views/staff/AbstractStaffDetails.js";
import type StaffDetailsWithMedia from "../../../../domain/views/staff/StaffDetailsWithMedia.js";

interface StaffRepositoryPort {
	findStaffWithoutMediaById(staffId: string): Promise<Staff | null>;

	findStaffWithMediaByIdentityId(identityId: string): Promise<StaffDetailsWithMedia | null>;

	findStaffByAuthProviderId(authProviderId: string): Promise<Staff | null>

	save(staff: Staff): Promise<Staff>;

    updateStaff(staffId: string, changesToMake: Partial<Staff>): Promise<Staff>;

    fetchAllStaffMembersByUnit(unitId: string): Promise<AbstractStaffDetails[]>

    fetchAll(): Promise<AbstractStaffDetails[]>
    
    fetchAllStaffWithMedia(): Promise<StaffDetailsWithMedia[]>
}

export type { StaffRepositoryPort };

