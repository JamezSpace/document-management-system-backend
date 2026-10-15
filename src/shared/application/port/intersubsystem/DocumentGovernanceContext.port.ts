import type {
	DocumentGovernanceFacts,
	GovernanceActorRelationship,
} from "./DocumentGovernancePolicy.port.js";

interface ResolvedDocumentGovernanceContext {
	relationships: GovernanceActorRelationship[];
	isAuthenticatedInternalStaff: boolean;
	hasRequiredClearance: boolean;
	hasActiveGuestReaderGrant: boolean;
	guestReaderGrantStatus?: "active" | "expired" | "revoked" | null;
	hasEffectiveUnitHeadSignature: boolean;
	unitHeadSignature?: {
		id: string;
		status: "signed" | "revoked" | "invalidated";
		documentVersionId: string | null;
		signedRevision: number | null;
		contentSha256: string | null;
		signedBy: string;
		signerName: string;
		signerDesignation: string | null;
		signedAt: Date;
		imageEndpoint: string | null;
	} | null;
	exportGrant: Exclude<DocumentGovernanceFacts["exportGrant"], undefined>;
}

interface DocumentGovernanceContextPort {
	hasRestrictedClearance(actorStaffId: string): Promise<boolean>;

	resolve(
		documentId: string,
		actorStaffId: string,
	): Promise<ResolvedDocumentGovernanceContext>;
}

export type {
	DocumentGovernanceContextPort,
	ResolvedDocumentGovernanceContext,
};
