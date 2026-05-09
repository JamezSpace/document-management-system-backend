import type { CorrespondenceDirection } from "../enum/correspondenceDirection.enum.js";

interface CorrespondenceMetadata {
	originatingUnitId: string;
	recipientUnitId: string | null;
    addressedToStaffId: string | null;
	subjectCodeId: string;
    direction: CorrespondenceDirection;
}

export type { CorrespondenceMetadata };

