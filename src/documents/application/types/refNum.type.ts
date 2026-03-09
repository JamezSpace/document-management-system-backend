import type { DocumentSubjectCode } from "../../domain/enum/DocumentSubjectCodes.enum.js";

interface RefNumPayload {
	year: number;
	originUnitId: string;
	recipientCode: string;
	volume: DocumentSubjectCode;
}

export type { RefNumPayload };
