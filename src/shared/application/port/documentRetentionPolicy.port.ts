import type { DocumentType } from "../types/DocumentRetentionPolicy/DocumentRetentionPolicy.type.js";

interface DocumentRetentionPolicyPort {
	getRetentionData(
		documentType: DocumentType,
	): Promise<{
		duration: number;
		archivalRequired: boolean;
		policyVersion: number;
	}>;
}

export type { DocumentRetentionPolicyPort };

