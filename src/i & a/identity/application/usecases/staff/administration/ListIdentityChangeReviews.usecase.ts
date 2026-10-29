import type { IdentityChangeRequestRepositoryPort } from "../../../ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { IdentityChangeRequestRecord } from "../../../types/user/selfService.type.js";

class ListIdentityChangeReviewsUseCase {
	constructor(private readonly repository: IdentityChangeRequestRepositoryPort) {}

	async execute(filters: {
		status?: IdentityChangeRequestRecord["status"];
		limit: number;
		offset: number;
	}) {
		const result = await this.repository.listForReview(filters);
		return {
			...result,
			page: Math.floor(filters.offset / filters.limit) + 1,
			pageSize: filters.limit,
			totalPages: Math.ceil(result.total / filters.limit),
		};
	}
}

export default ListIdentityChangeReviewsUseCase;
