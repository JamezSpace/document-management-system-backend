import type { RefNumPayload } from "../../types/refNum.type.js";

interface ReferenceSequenceRepositoryPort {
    nextSequence(payload: RefNumPayload): Promise<{
        nextCount: number;
        originUnit: string;
        recipientCode: string;
    }>;
}

export type { ReferenceSequenceRepositoryPort };

