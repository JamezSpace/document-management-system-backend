import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { GovernedIdentityChangeField } from "../../../../types/user/selfService.type.js";
import type { Status } from "../../../../../domain/enum/staff.enum.js";
import type {
	AdministrativeStaffListFilters,
	AdministrativeStaffRecord,
	AdministrativeStaffUpdate,
} from "../../../../types/staff/staffAdministration.type.js";

interface StaffAdministrationRepositoryPort {
	findById(
		staffId: string,
		tx?: TransactionContext,
	): Promise<AdministrativeStaffRecord | null>;

	list(filters: AdministrativeStaffListFilters): Promise<{
		items: AdministrativeStaffRecord[];
		total: number;
	}>;

	updateDetails(
		staffId: string,
		changes: AdministrativeStaffUpdate,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<AdministrativeStaffRecord | null>;

	transitionStatus(
		staffId: string,
		toStatus: Status,
		expectedRevision: number,
		tx: TransactionContext,
	): Promise<AdministrativeStaffRecord | null>;

	applyIdentityChange(
		identityId: string,
		field: Exclude<GovernedIdentityChangeField, "signature">,
		value: string | null,
		tx: TransactionContext,
	): Promise<number>;

	findAuthProviderId(
		identityId: string,
		tx: TransactionContext,
	): Promise<string | null>;
}

export type { StaffAdministrationRepositoryPort };
