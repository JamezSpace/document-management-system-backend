import type CreateBusinessFunctionUseCase from "../../../application/usecases/businessFunction/CreateBusinessFunction.usecase.js";

class BusinessFunctionController {
	constructor(
		private readonly createBusinessFunctionUseCase: CreateBusinessFunctionUseCase,
	) {}

	async createBusinessFunction(actorId: string, payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const newBusinessFunction =
			await this.createBusinessFunctionUseCase.createBusinessFunction(
                actorId,
				payload,
			);

		return newBusinessFunction;
	}
}

export default BusinessFunctionController;
