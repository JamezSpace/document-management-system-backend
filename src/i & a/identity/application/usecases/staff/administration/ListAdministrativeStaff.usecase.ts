import type { StaffAdministrationRepositoryPort } from "../../../ports/repos/entities/staff/StaffAdministrationRepository.port.js";
import type { AdministrativeStaffListFilters } from "../../../types/staff/staffAdministration.type.js";

class ListAdministrativeStaffUseCase {
	constructor(private readonly repository: StaffAdministrationRepositoryPort) {}

	async execute(filters: AdministrativeStaffListFilters) {
		const result = await this.repository.list(filters);
		return {
			...result,
			page: Math.floor(filters.offset / filters.limit) + 1,
			pageSize: filters.limit,
			totalPages: Math.ceil(result.total / filters.limit),
		};
	}
}

export default ListAdministrativeStaffUseCase;
