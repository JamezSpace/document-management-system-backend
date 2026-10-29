import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { PoolClient } from "pg";
import fastify from "fastify";

import type { AuditEventRepositoryPort, NewAuditEvent } from "../../src/audit/application/ports/AuditEventRepository.port.js";
import type { IdentityChangeRequestRepositoryPort } from "../../src/i & a/identity/application/ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { SelfServiceRepositoryPort } from "../../src/i & a/identity/application/ports/repos/entities/user/SelfServiceRepository.port.js";
import type { IdentityChangeRequestRecord, SelfServiceSettingsRecord } from "../../src/i & a/identity/application/types/user/selfService.type.js";
import RequestIdentityChangeUseCase from "../../src/i & a/identity/application/usecases/user/selfService/RequestIdentityChange.usecase.js";
import UpdateOwnProfileUseCase from "../../src/i & a/identity/application/usecases/user/selfService/UpdateOwnProfile.usecase.js";
import UploadIdentityChangeMediaUseCase from "../../src/i & a/identity/application/usecases/user/selfService/UploadIdentityChangeMedia.usecase.js";
import type SelfServiceController from "../../src/i & a/identity/api/controllers/user/SelfService.controller.js";
import selfServiceRoutes from "../../src/i & a/identity/api/routes/user/selfService.route.js";
import type { IdentityGovernancePolicyPort, IdentityGovernancePolicySnapshot } from "../../src/shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../src/shared/application/port/services/IdGenerator.port.js";
import type { MediaAssetRepositoryPort } from "../../src/shared/application/port/repos/MediaAssetRepository.port.js";
import type { MediaServicePort } from "../../src/shared/application/port/services/mediaService.port.js";
import type { TransactionManager } from "../../src/shared/application/port/TransactionManager.port.js";
import NexusError from "../../src/shared/errors/NexusError.js";
import type { TransactionContext } from "../../src/shared/infrastructure/persistence/primary/postgres.js";

const settings: SelfServiceSettingsRecord = {
	identityId: "identity-1",
	staffId: "staff-1",
	revision: 4,
	firstName: "Samuel",
	middleName: "Setonji",
	lastName: "James",
	email: "samuel@example.test",
	phoneNumber: "+2348011111111",
	staffNumber: 231433,
	employmentType: "permanent",
	status: "active",
	unit: { id: "unit-1", name: "Registry" },
	office: { id: "office-1", name: "Technical Office" },
	designation: { id: null, title: null },
	profilePicture: null,
	signature: { present: false, updatedAt: null },
};

class FakeSelfServiceRepository implements SelfServiceRepositoryPort {
	record = structuredClone(settings);

	async findSettings() {
		return structuredClone(this.record);
	}

	async updatePhoneNumber(
		_identityId: string,
		phoneNumber: string,
		expectedRevision: number,
	) {
		if (this.record.revision !== expectedRevision) return null;
		this.record.phoneNumber = phoneNumber;
		this.record.revision += 1;
		return this.record.revision;
	}

	async incrementRevision(_identityId: string, expectedRevision: number) {
		if (this.record.revision !== expectedRevision) return null;
		this.record.revision += 1;
		return this.record.revision;
	}

	async staffOwnsMedia(_staffId: string, mediaId: string) {
		return mediaId === "MEDIA-evidence-1";
	}
}

class FakeChangeRequestRepository implements IdentityChangeRequestRepositoryPort {
	requests: IdentityChangeRequestRecord[] = [];

	async saveBatch(requests: IdentityChangeRequestRecord[]) {
		this.requests.push(...requests);
	}

	async listByIdentity() {
		return [...this.requests];
	}
}

class FakeAuditRepository implements AuditEventRepositoryPort {
	events: NewAuditEvent[] = [];

	async append(event: NewAuditEvent) {
		this.events.push(event);
	}

	async list() {
		return [];
	}
}

class FakeTransactionManager implements TransactionManager {
	async execute<T>(work: (tx: TransactionContext) => Promise<T>) {
		return work({ client: {} as PoolClient });
	}
}

class SequenceIdGenerator implements IdGeneratorPort {
	private next = 1;
	generate() {
		return String(this.next++).padStart(4, "0");
	}
}

const policySnapshot: IdentityGovernancePolicySnapshot = {
	policyKey: "nexusfons_identity_governance",
	policyVersion: 1,
	fields: {
		phoneNumber: {
			mode: "direct",
			reasonCode: "self_phone_change_allowed",
			requirements: ["audit_identity_change"],
		},
		firstName: {
			mode: "approval_required",
			reasonCode: "legal_name_change_requires_approval",
			requirements: ["reason", "supporting_evidence", "hr_approval"],
		},
	},
};

class FakePolicy implements IdentityGovernancePolicyPort {
	async getActivePolicy() {
		return structuredClone(policySnapshot);
	}

	async evaluateField(field: string) {
		const decision = policySnapshot.fields[field] ?? {
			mode: "read_only" as const,
			reasonCode: "not_self_service",
			requirements: [],
		};
		return {
			policyKey: policySnapshot.policyKey,
			policyVersion: policySnapshot.policyVersion,
			decision: { field, ...decision },
		};
	}
}

test("self-service phone update enforces revision and appends audit evidence", async () => {
	const repo = new FakeSelfServiceRepository();
	const audit = new FakeAuditRepository();
	const useCase = new UpdateOwnProfileUseCase(
		repo,
		new FakePolicy(),
		audit,
		new FakeTransactionManager(),
		new SequenceIdGenerator(),
	);

	const result = await useCase.execute({
		identityId: "identity-1",
		staffId: "staff-1",
		officeId: "office-1",
		unitId: "unit-1",
		phoneNumber: "+2348022222222",
		expectedRevision: 4,
		requestId: "request-1",
	});

	assert.equal(result.status, "applied");
	assert.equal(result.revision, 5);
	assert.equal(repo.record.phoneNumber, "+2348022222222");
	assert.equal(audit.events.length, 1);
	assert.equal(audit.events[0]?.aggregateId, "identity-1");
	assert.equal(audit.events[0]?.reason, "self_phone_change_allowed");
});

test("self-service phone update rejects a stale profile revision", async () => {
	const useCase = new UpdateOwnProfileUseCase(
		new FakeSelfServiceRepository(),
		new FakePolicy(),
		new FakeAuditRepository(),
		new FakeTransactionManager(),
		new SequenceIdGenerator(),
	);

	await assert.rejects(
		useCase.execute({
			identityId: "identity-1",
			staffId: "staff-1",
			officeId: null,
			unitId: null,
			phoneNumber: "+2348022222222",
			expectedRevision: 3,
		}),
		(error: unknown) => error instanceof NexusError && error.errorCode === "identity_revision_conflict",
	);
});

test("governed name change stores the active policy decision", async () => {
	const requests = new FakeChangeRequestRepository();
	const audit = new FakeAuditRepository();
	const useCase = new RequestIdentityChangeUseCase(
		new FakeSelfServiceRepository(),
		requests,
		new FakePolicy(),
		audit,
		new FakeTransactionManager(),
		new SequenceIdGenerator(),
	);

	const result = await useCase.execute({
		identityId: "identity-1",
		staffId: "staff-1",
		officeId: "office-1",
		unitId: "unit-1",
		changes: { firstName: "James" },
		reason: "Legal name correction",
		evidenceMediaIds: ["MEDIA-evidence-1"],
	});

	assert.equal(result.status, "pending");
	assert.equal(requests.requests.length, 1);
	assert.equal(requests.requests[0]?.fieldName, "firstName");
	assert.equal(requests.requests[0]?.policyVersion, 1);
	assert.equal(requests.requests[0]?.decisionReasonCode, "legal_name_change_requires_approval");
	assert.equal(audit.events.length, 1);
});

test("self-service HTTP bootstrap exposes the profile revision as an ETag", async (t) => {
	const app = fastify({ logger: false });
	t.after(() => app.close());
	app.decorateRequest("user", null);
	app.decorateRequest("actor", null);
	app.addHook("preHandler", async (request) => {
		request.actor = {
			identityId: "identity-1",
			staffId: "staff-1",
			officeId: "office-1",
			unitId: "unit-1",
			grants: [],
		};
	});

	const controller = {
		async getSettings() {
			return {
				revision: 7,
				profile: { signature: { present: false, updatedAt: null } },
				employment: { staffId: "staff-1" },
				governance: { policy: { key: "nexusfons_identity_governance", version: 1 }, fields: {} },
				pendingChanges: [],
				authority: { roles: [], capabilities: [], roleAssignments: [], capabilityScopes: {} },
			};
		},
	} as unknown as SelfServiceController;

	await app.register(selfServiceRoutes, { controller });
	const response = await app.inject({ method: "GET", url: "/me" });

	assert.equal(response.statusCode, 200);
	assert.equal(response.headers.etag, '"profile-7"');
	assert.equal(response.json().data.profile.signature.present, false);
});

test("identity change evidence upload creates an actor-owned media record", async () => {
	const saved: Array<{ id: string; uploadedBy: string }> = [];
	const mediaRepo = {
		async save(payload: { id: string; uploadedBy: string }) {
			saved.push({ id: payload.id, uploadedBy: payload.uploadedBy });
			return {
				...payload,
				storageProvider: "LOCAL",
				bucketName: null,
				objectKey: "evidence/file",
				format: "pdf",
				mimeType: "application/pdf",
				sizeBytes: 8,
				checksum: "a".repeat(64),
				uploadedAt: new Date(),
				uploadedByType: "staff" as const,
			};
		},
		async findById() {
			return null;
		},
	} as MediaAssetRepositoryPort;
	const mediaService = {
		async uploadIdentityChangeMedia() {
			return {
				storageProvider: "LOCAL",
				bucketName: "mock",
				objectKey: "evidence/file",
				format: "pdf",
				sizeBytes: 8,
			};
		},
	} as unknown as MediaServicePort;
	const audit = new FakeAuditRepository();
	const useCase = new UploadIdentityChangeMediaUseCase(
		mediaRepo,
		mediaService,
		audit,
		new FakeTransactionManager(),
		new SequenceIdGenerator(),
	);

	const result = await useCase.execute({
		identityId: "identity-1",
		staffId: "staff-1",
		officeId: "office-1",
		unitId: "unit-1",
		purpose: "evidence",
		file: Buffer.from("%PDF-1.7"),
		mimeType: "application/pdf",
	});

	assert.equal(result.mediaId, "MEDIA-0001");
	assert.deepEqual(saved, [{ id: "MEDIA-0001", uploadedBy: "staff-1" }]);
	assert.equal(audit.events[0]?.action, "identity.change_request.media.upload");
});
