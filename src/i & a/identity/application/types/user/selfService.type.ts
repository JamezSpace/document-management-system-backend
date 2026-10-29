interface SelfServiceSettingsRecord {
	identityId: string;
	staffId: string;
	revision: number;
	firstName: string;
	middleName: string | null;
	lastName: string;
	email: string;
	phoneNumber: string;
	staffNumber: number;
	employmentType: string;
	status: string;
	unit: { id: string | null; name: string | null };
	office: { id: string | null; name: string | null };
	designation: { id: string | null; title: string | null };
	profilePicture: {
		objectKey: string;
		format: string;
		updatedAt: Date;
	} | null;
	signature: { present: boolean; updatedAt: Date | null };
}

type GovernedIdentityChangeField =
	| "firstName"
	| "middleName"
	| "lastName"
	| "email"
	| "signature";

interface IdentityChangeRequestRecord {
	id: string;
	requestGroupId: string;
	identityId: string;
	staffId: string;
	fieldName: GovernedIdentityChangeField;
	previousValue: unknown;
	requestedValue: unknown;
	reason: string;
	evidenceMediaIds: string[];
	status: "pending" | "approved" | "rejected" | "applied" | "cancelled";
	policyKey: string;
	policyVersion: number;
	decisionReasonCode: string;
	requestedAt: Date;
	reviewedBy: string | null;
	reviewedAt: Date | null;
	reviewReason: string | null;
	appliedAt: Date | null;
}

export type {
	GovernedIdentityChangeField,
	IdentityChangeRequestRecord,
	SelfServiceSettingsRecord,
};
