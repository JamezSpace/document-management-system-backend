import type { DocumentSubjectCode } from "../enum/documentSubjectCodes.enum.js";

interface CorrespondenceMetadata {
	originatingUnitId: string; // ITCC
	recipientCode: string
	subjectCode: DocumentSubjectCode;
}

export type { CorrespondenceMetadata };

