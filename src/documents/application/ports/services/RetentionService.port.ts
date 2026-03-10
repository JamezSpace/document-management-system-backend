import type { RetentionMetadata } from "../../../domain/metadata/Retention.metadata.js";
import { DocumentType } from "../../../../shared/application/types/documentPolicy/documentPolicy.type.js";

interface RetentionServicePort {
	computeRetention(
		documentType: DocumentType,
		retentionStartDate: Date,
	): Promise<RetentionMetadata>;
}

export type { RetentionServicePort };
