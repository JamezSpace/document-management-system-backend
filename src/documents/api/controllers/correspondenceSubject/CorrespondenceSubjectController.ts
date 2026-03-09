import type CreateCorrespondenceSubjectUseCase from "../../../application/usecases/correspondenceSubject/CreateCorrespondenceSubject.usecase.js";

class CorrespondenceSubjectController {
	constructor(
		private readonly createCorrespondenceSubjectUseCase: CreateCorrespondenceSubjectUseCase,
	) {}

	async createCorrespondenceSubject(payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const newCorrespondenceSubject =
			await this.createCorrespondenceSubjectUseCase.createCorrespondenceSubject(
				payload,
			);

		return newCorrespondenceSubject;
	}
}

export default CorrespondenceSubjectController;
