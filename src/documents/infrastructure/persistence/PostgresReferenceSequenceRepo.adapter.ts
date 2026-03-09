import type { PostgresDb } from "@fastify/postgres";
import type { ReferenceSequenceRepositoryPort } from "../../application/ports/repos/ReferenceSequenceRepository.port.js";
import type { RefNumPayload } from "../../application/types/refNum.type.js";

class PostgresReferenceSequenceRepositoryAdapter implements ReferenceSequenceRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async nextSequence(payload: RefNumPayload): Promise<{
		nextCount: number;
		originUnit: string;
		recipientCode: string;
	}> {
		const query = `
            SELECT * FROM document.next_reference_sequence($1,$2,$3,$4);
        `;

		const result = await this.dbPool.query(query, [
			payload.year,
			payload.originUnitId,
			payload.recipientCode,
			payload.volume,
		]);

		return result.rows[0];
	}
}

export default PostgresReferenceSequenceRepositoryAdapter;