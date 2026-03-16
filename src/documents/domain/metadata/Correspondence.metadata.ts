import type { CorrespondenceDirection } from "../enum/correspondenceDirection.enum.js";

interface CorrespondenceMetadata {
	originatingUnitId: string;
    direction: CorrespondenceDirection;
    recipientCode: string
	subjectCodeId: string;
}

export type { CorrespondenceMetadata };

