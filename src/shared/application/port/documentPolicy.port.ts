import type { DocumentType } from "../types/documentPolicy/documentPolicy.type.js";

interface DocumentPolicyPort {
	getRetentionData(
		documentType: DocumentType,
	): Promise<{
		duration: number;
		archivalRequired: boolean;
		policyVersion: number;
	}>;
}

export type { DocumentPolicyPort };
