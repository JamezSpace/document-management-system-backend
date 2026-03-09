import type { CorrespondenceAddressee } from "../enum/correspondenceAddresee.enum.js";
import type { CorrespondenceVolume } from "../enum/correspondenceVolumes.enum.js";
import type { RecipientSector } from "../enum/recipientSector.enum.js";

interface CorrespondenceMetadata {
	originatingUnitId: string; // ITCC
	addressedTo: CorrespondenceAddressee;
	recipientUnitId?: string;
	recipientName?: string;
	recipientSector: RecipientSector;
	volume: CorrespondenceVolume;
}

export type { CorrespondenceMetadata };
