import type { IdGeneratorPort } from "../../../../shared/application/port/IdGenerator.port.js";
import type { CorrespondenceSubjectEventsPort } from "../../ports/events/CorrespondenceSubjectEvents.port.js";
import type { CorrespondenceSubjectRepositoryPort } from "../../ports/repos/CorrespondenceRepository.port.js";
import CorrespondenceSubject from "../../../domain/CorrespondenceSubject.js";

class CreateCorrespondenceSubjectUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly correspondenceSubjectEvents: CorrespondenceSubjectEventsPort,
		private readonly correspondenceSubjectRepo: CorrespondenceSubjectRepositoryPort,
	) {}

	async createCorrespondenceSubject(payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const uuid = this.idGenerator.generate();
		const correspondenceSubjectId = "CORR-SUBJ-" + uuid;

		const correspondenceSubject = new CorrespondenceSubject({
			id: correspondenceSubjectId,
			code: payload.code,
			name: payload.name,
			description: payload.description ?? null,
		});

		const newCorrespondenceSubject =
			await this.correspondenceSubjectRepo.save(correspondenceSubject);

		if (newCorrespondenceSubject) {
			await this.correspondenceSubjectEvents.correspondenceSubjectCreated(
				{
					correspondenceSubjectId:
						newCorrespondenceSubject.getCorrespondenceSubjectId(),
				},
			);
		}

		return newCorrespondenceSubject;
	}
}

export default CreateCorrespondenceSubjectUseCase;
