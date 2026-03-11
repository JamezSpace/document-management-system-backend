import type { ReferenceSequenceRepositoryPort } from "../../application/ports/repos/ReferenceSequenceRepository.port.js";
import type { ReferenceNumberServicePort } from "../../application/ports/services/ReferenceNumberService.port.js";
import type { RefNumPayload } from "../../application/types/refNum.type.js";

class ReferenceNumberService implements ReferenceNumberServicePort {
	constructor(private readonly refNumSeqRepo: ReferenceSequenceRepositoryPort) {}

	async generate(payload: RefNumPayload) {
		const result = await this.refNumSeqRepo.nextSequence(payload);

		const padded = result.nextCount.toString().padStart(4, "0");

		return `${payload.year}/${result.originUnit}/${result.recipientCode}/${payload.subjectCode}/${padded}`;
	}
}

export default ReferenceNumberService;
