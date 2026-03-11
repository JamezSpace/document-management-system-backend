import type { DocumentSubjectCode } from "../../domain/enum/documentSubjectCodes.enum.js";

interface RefNumPayload {
	year: number;
	originUnitId: string;
	recipientCode: string;
	subjectCode: DocumentSubjectCode;
}

export type { RefNumPayload };
