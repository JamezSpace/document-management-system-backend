import type { ReferenceSequenceRepositoryPort } from "../../application/ports/repos/ReferenceSequenceRepository.port.js";
import type { ReferenceNumberServicePort } from "../../application/ports/services/ReferenceNumberService.port.js";
import type { RefNumPayload } from "../../application/types/refNum.type.js";

class ReferenceNumberService implements ReferenceNumberServicePort {
	constructor(private readonly refNumSeqRepo: ReferenceSequenceRepositoryPort) {}

	async generate(payload: RefNumPayload) {
		const result = await this.refNumSeqRepo.nextSequence(payload);

		const padded = result.nextCount.toString().padStart(4, "0");

        // e.g. an internal memo has both origin unit and recipient unit to be the same
        if(result.originUnit === result.recipientCode)
            return `${payload.year}/${result.recipientCode}/${payload.subjectCode}/${payload.functionCode}/${padded}`;

		return `${payload.year}/${result.originUnit}/${result.recipientCode}/${payload.subjectCode}/${payload.functionCode}/${padded}`;
	}
}

export default ReferenceNumberService;
