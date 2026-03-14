import { DocumentType } from "../../../../shared/application/types/DocumentRetentionPolicy/DocumentRetentionPolicy.type.js";
import type { RetentionMetadata } from "../../../domain/metadata/Retention.metadata.js";

interface RetentionServicePort {
	computeRetention(
		documentType: DocumentType,
		retentionStartDate: Date,
	): Promise<RetentionMetadata>;
}

export type { RetentionServicePort };

