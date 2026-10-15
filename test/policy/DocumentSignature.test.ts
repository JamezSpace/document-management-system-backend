import { strict as assert } from "node:assert";
import { test } from "node:test";

import SignDocumentAsUnitHeadUseCase from "../../src/documents/application/usecases/document/SignDocumentAsUnitHead.usecase.js";
import DocumentPdfRenderer from "../../src/documents/application/services/DocumentPdfRenderer.service.js";
import Document from "../../src/documents/domain/entities/document/Document.js";
import DocumentVersion from "../../src/documents/domain/entities/document/DocumentVersion.js";

function documentFixture() {
	const version = new DocumentVersion({
		id: "VERSION-1",
		documentId: "DOC-1",
		contentDelta: { ops: [{ insert: "Approved content" }] },
		versionNumber: 1,
		createdAt: new Date("2026-09-01T00:00:00.000Z"),
		createdBy: "AUTHOR-1",
		lifecycle: {
			currentState: "draft" as any,
			stateEnteredAt: new Date("2026-09-01T00:00:00.000Z"),
			stateEnteredBy: "AUTHOR-1",
		},
	});
	return new Document({
		id: "DOC-1",
		ownerId: "AUTHOR-1",
		title: "Approval memo",
		version,
		revision: 4,
		addressees: [{ recipientUnitId: "UNIT-2", addressedToDesignationId: "DESIG-2", isPrimary: true }],
		classification: {
			sensitivity: "internal" as any,
			governancePolicyKey: "nexusfons_document_governance",
			governancePolicyVersion: 3,
			functionCodeId: "FUNCTION-1",
			documentTypeId: "TYPE-1",
			classifiedBy: "AUTHOR-1",
			classifiedAt: new Date("2026-09-01T00:00:00.000Z"),
		},
		correspondence: { originatingUnitId: "UNIT-1", subjectCodeId: "SUBJECT-1", direction: "internal" as any },
		retention: {
			policyVersion: 1,
			retentionScheduleId: "RETENTION-1",
			retentionStartDate: new Date("2026-09-01T00:00:00.000Z"),
			disposalEligibilityDate: new Date("2031-09-01T00:00:00.000Z"),
			archivalRequired: false,
		},
	});
}

test("Unit Head signing snapshots media, binds content, and is idempotent", async () => {
	const document = documentFixture();
	let revision = 4;
	let stored: any = null;
	let increments = 0;
	const audits: any[] = [];
	const repo = {
		findActiveStaffSignatureMedia: async () => ({
			id: "MEDIA-1", objectKey: "signatures/head", format: "svg",
			mimeType: "image/svg+xml", checksum: "media-checksum",
			signerName: "Ada Head", signerDesignation: "Unit Head",
		}),
		findEffectiveByDocument: async () => stored,
		findById: async () => stored,
		listByDocument: async () => stored ? [stored] : [],
		invalidateOutdated: async () => undefined,
		recordUnitHeadSignature: async (payload: any) => {
			stored = {
				...payload,
				signerName: "Ada Head",
				signerDesignation: "Unit Head",
				signatureMedia: { id: "MEDIA-1", objectKey: "signatures/head", format: "svg", mimeType: "image/svg+xml", checksum: "media-checksum" },
				revokedBy: null, revokedAt: null, revocationReason: null,
				invalidatedAt: null, invalidationReason: null, status: "signed",
			};
			return stored;
		},
		revoke: async (_signatureId: string, _documentId: string, actor: string, at: Date, reason: string) => {
			stored = { ...stored, revokedBy: actor, revokedAt: at, revocationReason: reason, status: "revoked" };
			return true;
		},
	};
	const useCase = new SignDocumentAsUnitHeadUseCase(
		{ generate: () => "SIGNATURE-1" },
		{
			findDocumentById: async () => document,
			lockRevision: async (_id: string, expected: number) => revision === expected,
			incrementRevision: async (_id: string, expected: number) => {
				if (revision !== expected) return null;
				increments += 1;
				revision += 1;
				return revision;
			},
		} as any,
		repo as any,
		{ resolve: async () => ({ relationships: ["unit_head"] }) } as any,
		{ execute: async (operation: any) => operation({ client: {} }) } as any,
		{ record: async (event: any) => { audits.push(event); } },
		{ authorize: async () => ({}) } as any,
		{ readMedia: async () => null, resolveMediaToPublicURL: () => null } as any,
	);

	const first = await useCase.execute("DOC-1", "HEAD-1", 4);
	assert.equal(first.created, true);
	assert.equal(first.documentRevision, 5);
	assert.equal(first.documentVersionId, "VERSION-1");
	assert.match(first.contentSha256!, /^[a-f0-9]{64}$/);
	assert.equal(first.imageEndpoint, "/api/document/DOC-1/signatures/DOC-SIGN-SIGNATURE-1/image");

	const repeated = await useCase.execute("DOC-1", "HEAD-1", 5);
	assert.equal(repeated.created, false);
	assert.equal(repeated.documentRevision, 5);
	assert.equal(increments, 1);
	assert.equal(audits.length, 1);

	const revoked = await useCase.revoke("DOC-1", first.id, "Superseded", "HEAD-1", 5);
	assert.equal(revoked.documentRevision, 6);
	assert.equal(stored.status, "revoked");
});

test("PDF rendering embeds the transient PNG rendition of an SVG signature", () => {
	const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
	const pdf = DocumentPdfRenderer.render(documentFixture(), null, {
		image: png,
		format: "png",
		signerName: "Ada Head",
		signerDesignation: "Unit Head",
		signedAt: new Date("2026-09-23T12:00:00.000Z"),
		contentSha256: "a".repeat(64),
	});
	const text = pdf.toString("latin1");
	assert.match(text, /^%PDF-1\.4/);
	assert.match(text, /\/SignatureImage/);
	assert.match(text, /Authorized by: Ada Head/);
});
