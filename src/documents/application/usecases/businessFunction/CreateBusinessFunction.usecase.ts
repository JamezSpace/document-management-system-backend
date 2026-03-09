import type { IdGeneratorPort } from "../../../../shared/application/port/IdGenerator.port.js";
import type { BusinessFunctionEventsPort } from "../../ports/events/BusinessFunctionEvents.port.js";
import type { BusinessFunctionRepositoryPort } from "../../ports/repos/BusinessFunctionRepository.port.js";
import BusinessFunction from "../../../domain/BusinessFunction.js";

class CreateBusinessFunctionUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly businessFunctionEvents: BusinessFunctionEventsPort,
		private readonly businessFunctionRepo: BusinessFunctionRepositoryPort,
	) {}

	async createBusinessFunction(payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const uuid = this.idGenerator.generate();
		const businessFunctionId = "BUS-FUNC-" + uuid;

		const businessFunction = new BusinessFunction({
			id: businessFunctionId,
			code: payload.code,
			name: payload.name,
			description: payload.description ?? null,
		});

		const newBusinessFunction =
			await this.businessFunctionRepo.save(businessFunction);

		if (newBusinessFunction) {
			await this.businessFunctionEvents.businessFunctionCreated({
				businessFunctionId:
					newBusinessFunction.getBusinessFunctionId(),
			});
		}

		return newBusinessFunction;
	}
}

export default CreateBusinessFunctionUseCase;
