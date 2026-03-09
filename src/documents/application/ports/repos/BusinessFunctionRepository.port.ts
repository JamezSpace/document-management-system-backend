import type BusinessFunction from "../../../domain/BusinessFunction.js";

interface BusinessFunctionRepositoryPort {
	save(businessFunction: BusinessFunction): Promise<BusinessFunction>;

	updateBusinessFunction(
		businessFunctionId: string,
		changesToMake: Partial<BusinessFunction>,
	): Promise<BusinessFunction>;

	findBusinessFunctionById(
		businessFunctionId: string,
	): Promise<BusinessFunction | null>;
}

export type { BusinessFunctionRepositoryPort };
