import { strict as assert } from "node:assert";
import { test } from "node:test";

import DocumentGovernanceGuard from "../../src/documents/application/services/DocumentGovernanceGuard.service.js";
import DocumentGovernanceObligationExecutor from "../../src/documents/application/services/DocumentGovernanceObligationExecutor.service.js";
import ManageDocumentAttachmentUseCase from "../../src/documents/application/usecases/document/ManageDocumentAttachment.usecase.js";
import type { DocumentGovernancePolicyPort } from "../../src/shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

const policyReference = { policyId: "attachment-policy", policyVersion: 1 };
const context = {
	relationships: ["author"] as Array<"author">,
	isAuthenticatedInternalStaff: true,
	hasRequiredClearance: true,
	hasActiveGuestReaderGrant: false,
	hasEffectiveUnitHeadSignature: true,
	exportGrant: null,
};
const obligations = new DocumentGovernanceObligationExecutor({ record: async () => undefined });
const transactionManager = {
	execute: async (operation: any) => operation({ client: {} }),
} as any;
const ids = { generate: () => "1" };

function documentFixture(id: string, sensitivity: "public" | "confidential", versionId?: string) {
	return {
		id,
		ownerId: "STAFF-1",
		title: `Document ${id}`,
		referenceNumber: `REF-${id}`,
		revision: 4,
		classification: {
			sensitivity,
			governancePolicyKey: policyReference.policyId,
			governancePolicyVersion: policyReference.policyVersion,
		},
		createdAt: new Date(`2026-09-${id === "PARENT" ? "10" : "09"}T00:00:00.000Z`),
		getCurrentVersion: () => versionId ? {
			id: versionId,
			versionNumber: 3,
			getState: () => "draft",
		} : null,
	} as any;
}

function governance(policy: DocumentGovernancePolicyPort) {
	return new DocumentGovernanceGuard(
		policy,
		{ resolve: async () => context } as any,
		obligations,
	);
}

test("attachment candidates expose only governed, versioned, non-circular documents", async () => {
	const parent = documentFixture("PARENT", "public");
	const allowed = documentFixture("ALLOWED", "public", "VERSION-3");
	const circular = documentFixture("CIRCULAR", "public", "VERSION-4");
	const denied = documentFixture("DENIED", "confidential", "VERSION-9");
	const policy: DocumentGovernancePolicyPort = {
		getSensitivityLevels: () => ["public", "internal", "confidential", "restricted"],
		getActivePolicyReference: async () => policyReference,
		evaluateAction: async (action, facts) => ({
			allowed: action === "attach" || facts.sensitivity === "public",
			...policyReference,
			reasonCode: facts.sensitivity === "public" ? "allowed" : "hidden",
			obligations: [],
		}),
	};
	let filteredIds: string[] = [];
	const useCase = new ManageDocumentAttachmentUseCase(
		{
			findDocumentById: async () => parent,
			discover: async () => [parent, allowed, circular, denied],
		} as any,
		{
			filterEligibleInternalSources: async (_parentId: string, candidateIds: string[]) => {
				filteredIds = candidateIds;
				return new Set(["ALLOWED"]);
			},
		} as any,
		governance(policy),
		transactionManager,
		ids,
	);

	const result = await useCase.candidates("PARENT", "Document", "STAFF-1");
	assert.deepEqual(filteredIds, ["ALLOWED", "CIRCULAR"]);
	assert.equal(result.items.length, 1);
	assert.deepEqual(result.items[0]!.version, { id: "VERSION-3", number: 3 });
});

test("internal attachment confirmation rechecks access and pins the selected version", async () => {
	const parent = documentFixture("PARENT", "public");
	const source = documentFixture("SOURCE", "public", "VERSION-3");
	let saved: any = null;
	const authorizationChecks: string[] = [];
	const policy: DocumentGovernancePolicyPort = {
		getSensitivityLevels: () => ["public", "internal", "confidential", "restricted"],
		getActivePolicyReference: async () => policyReference,
		evaluateAction: async (action) => {
			authorizationChecks.push(action);
			return { allowed: true, ...policyReference, reasonCode: "allowed", obligations: [] };
		},
	};
	const useCase = new ManageDocumentAttachmentUseCase(
		{
			lockAttachmentDocuments: async () => true,
			findDocumentById: async (id: string) => id === "PARENT" ? parent : source,
			incrementRevision: async () => 5,
		} as any,
		{
			sourceVersionExists: async () => true,
			wouldCreateCycle: async () => false,
			save: async (payload: any) => { saved = payload; },
			listByDocument: async () => [],
		} as any,
		governance(policy),
		transactionManager,
		ids,
	);

	const result = await useCase.attachInternal({
		parentDocumentId: "PARENT",
		sourceDocumentId: "SOURCE",
		sourceVersionId: "VERSION-3",
		actorStaffId: "STAFF-1",
		expectedRevision: 4,
	});
	assert.equal(result.documentRevision, 5);
	assert.deepEqual(authorizationChecks, ["attach", "discover", "view"]);
	assert.equal(saved.sourceType, "internal_document");
	assert.equal(saved.sourceDocumentVersionId, "VERSION-3");
});

test("internal attachment confirmation rejects circular relationships", async () => {
	const parent = documentFixture("PARENT", "public");
	const source = documentFixture("SOURCE", "public", "VERSION-3");
	let saved = false;
	const policy: DocumentGovernancePolicyPort = {
		getSensitivityLevels: () => ["public", "internal", "confidential", "restricted"],
		getActivePolicyReference: async () => policyReference,
		evaluateAction: async () => ({ allowed: true, ...policyReference, reasonCode: "allowed", obligations: [] }),
	};
	const useCase = new ManageDocumentAttachmentUseCase(
		{
			lockAttachmentDocuments: async () => true,
			findDocumentById: async (id: string) => id === "PARENT" ? parent : source,
		} as any,
		{
			sourceVersionExists: async () => true,
			wouldCreateCycle: async () => true,
			save: async () => { saved = true; },
		} as any,
		governance(policy),
		transactionManager,
		ids,
	);

	await assert.rejects(
		useCase.attachInternal({
			parentDocumentId: "PARENT",
			sourceDocumentId: "SOURCE",
			sourceVersionId: "VERSION-3",
			actorStaffId: "STAFF-1",
			expectedRevision: 4,
		}),
		(error: any) => error.errorCode === "conflict",
	);
	assert.equal(saved, false);
});

test("uploaded attachments fail closed until virus scanning reports clean", async () => {
	const parent = documentFixture("PARENT", "public");
	const policy: DocumentGovernancePolicyPort = {
		getSensitivityLevels: () => ["public", "internal", "confidential", "restricted"],
		getActivePolicyReference: async () => policyReference,
		evaluateAction: async () => ({ allowed: true, ...policyReference, reasonCode: "allowed", obligations: [] }),
	};
	const useCase = new ManageDocumentAttachmentUseCase(
		{
			lockRevision: async () => true,
			findDocumentById: async () => parent,
		} as any,
		{
			findUploadedMedia: async () => ({
				id: "MEDIA-1",
				format: "pdf",
				mimeType: "application/pdf",
				sizeBytes: 1024,
				checksum: "a".repeat(64),
				uploadedBy: "STAFF-1",
				uploadedByType: "staff",
				isActive: true,
				virusScanStatus: "pending",
			}),
		} as any,
		governance(policy),
		transactionManager,
		ids,
	);

	await assert.rejects(
		useCase.attachUploaded({
			parentDocumentId: "PARENT",
			mediaId: "MEDIA-1",
			actorStaffId: "STAFF-1",
			expectedRevision: 4,
		}),
		(error: any) => error.errorCode === "conflict",
	);
});
