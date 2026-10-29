import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { PoolClient } from "pg";

import type { AuditEventRepositoryPort, NewAuditEvent } from "../../src/audit/application/ports/AuditEventRepository.port.js";
import type { StaffMediaRepositoryPort } from "../../src/i & a/identity/application/ports/repos/entities/media/StaffMediaRepository.port.js";
import type { StaffAdministrationRepositoryPort } from "../../src/i & a/identity/application/ports/repos/entities/staff/StaffAdministrationRepository.port.js";
import type { IdentityChangeRequestRepositoryPort } from "../../src/i & a/identity/application/ports/repos/entities/user/IdentityChangeRequestRepository.port.js";
import type { AuthServicePort } from "../../src/i & a/identity/application/ports/services/AuthService.port.js";
import type { AdministrativeStaffRecord, AdministrativeStaffUpdate } from "../../src/i & a/identity/application/types/staff/staffAdministration.type.js";
import type { GovernedIdentityChangeField, IdentityChangeRequestRecord } from "../../src/i & a/identity/application/types/user/selfService.type.js";
import ReviewIdentityChangeUseCase from "../../src/i & a/identity/application/usecases/staff/administration/ReviewIdentityChange.usecase.js";
import TransitionStaffStatusUseCase from "../../src/i & a/identity/application/usecases/staff/administration/TransitionStaffStatus.usecase.js";
import UpdateAdministrativeStaffUseCase from "../../src/i & a/identity/application/usecases/staff/administration/UpdateAdministrativeStaff.usecase.js";
import { EmploymentType, Status } from "../../src/i & a/identity/domain/enum/staff.enum.js";
import type { IdentityGovernanceFieldDecision, IdentityGovernancePolicyPort } from "../../src/shared/application/port/intersubsystem/IdentityGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../src/shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../src/shared/application/port/TransactionManager.port.js";
import type { TransactionContext } from "../../src/shared/infrastructure/persistence/primary/postgres.js";

const baseStaff: AdministrativeStaffRecord = {
	staffId: "staff-target",
	identityId: "identity-target",
	revision: 3,
	firstName: "Ada",
	middleName: null,
	lastName: "Okafor",
	fullName: "Ada Okafor",
	email: "ada@example.test",
	staffNumber: 1001,
	employmentType: EmploymentType.PERMANENT,
	status: Status.ACTIVE,
	unit: { id: "unit-1", name: "Registry" },
	office: { id: "office-1", name: "Main Office" },
	designation: { id: "designation-1", title: "Officer" },
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: null,
};

class FakeStaffAdministrationRepository implements StaffAdministrationRepositoryPort {
	record = structuredClone(baseStaff);
	appliedIdentityChanges: Array<{ field: string; value: string | null }> = [];

	async findById(staffId: string) {
		return staffId === this.record.staffId ? structuredClone(this.record) : null;
	}

	async list() {
		return { items: [structuredClone(this.record)], total: 1 };
	}

	async updateDetails(
		_staffId: string,
		changes: AdministrativeStaffUpdate,
		expectedRevision: number,
	) {
		if (this.record.revision !== expectedRevision) return null;
		if (changes.staffNumber !== undefined) this.record.staffNumber = changes.staffNumber;
		if (changes.employmentType !== undefined) this.record.employmentType = changes.employmentType;
		if (changes.unitId !== undefined) this.record.unit.id = changes.unitId;
		if (changes.officeId !== undefined) this.record.office.id = changes.officeId;
		if (changes.designationId !== undefined) this.record.designation.id = changes.designationId;
		this.record.revision += 1;
		return structuredClone(this.record);
	}

	async transitionStatus(_staffId: string, toStatus: Status, expectedRevision: number) {
		if (this.record.revision !== expectedRevision) return null;
		this.record.status = toStatus;
		this.record.revision += 1;
		return structuredClone(this.record);
	}

	async applyIdentityChange(
		_identityId: string,
		field: Exclude<GovernedIdentityChangeField, "signature">,
		value: string | null,
	) {
		this.appliedIdentityChanges.push({ field, value });
		return 7;
	}

	async findAuthProviderId() {
		return "firebase-target";
	}
}

class FakeIdentityChangeRequestRepository implements IdentityChangeRequestRepositoryPort {
	requests: IdentityChangeRequestRecord[] = [];

	async saveBatch(requests: IdentityChangeRequestRecord[]) {
		this.requests.push(...requests);
	}

	async listByIdentity(identityId: string) {
		return this.requests.filter((request) => request.identityId === identityId);
	}

	async findById(requestId: string) {
		return this.requests.find((request) => request.id === requestId) ?? null;
	}

	async listForReview() {
		return { items: [...this.requests], total: this.requests.length };
	}

	async completeReview(
		requestId: string,
		decision: "rejected" | "applied",
		reviewerId: string,
		reviewReason: string,
	) {
		const request = this.requests.find((item) => item.id === requestId);
		if (!request || request.status !== "pending") return false;
		request.status = decision;
		request.reviewedBy = reviewerId;
		request.reviewReason = reviewReason;
		return true;
	}
}

class FakeStaffMediaRepository implements StaffMediaRepositoryPort {
	assigned: Array<{ staffId: string; mediaId: string; assetRole: string }> = [];
	async save(payload: { staffId: string; mediaId: string; assetRole: string }) {
		this.assigned.push(payload);
	}
	async deactivateByRole() {}
}

class FakeAuthService implements AuthServicePort {
	emailUpdates: Array<{ authProviderId: string; email: string }> = [];
	async verifyIdToken() { return "firebase-target"; }
	async createUser() { return { authProviderId: "firebase-target" }; }
	async updateUserEmail(authProviderId: string, email: string) {
		this.emailUpdates.push({ authProviderId, email });
	}
	async generatePasswordSetupLink() { return "https://example.test/setup"; }
}

class FakePolicy implements IdentityGovernancePolicyPort {
	constructor(
		private readonly resolve: (field: string) => IdentityGovernanceFieldDecision,
		private readonly policyKey = "nexusfons_staff_administration",
	) {}

	async getActivePolicy() {
		return { policyKey: this.policyKey, policyVersion: 1, fields: {} };
	}

	async evaluateField(field: string) {
		return { policyKey: this.policyKey, policyVersion: 1, decision: this.resolve(field) };
	}
}

class FakeAuditRepository implements AuditEventRepositoryPort {
	events: NewAuditEvent[] = [];
	async append(event: NewAuditEvent) { this.events.push(event); }
	async list() { return []; }
}

class FakeTransactionManager implements TransactionManager {
	async execute<T>(work: (tx: TransactionContext) => Promise<T>) {
		return work({ client: {} as PoolClient });
	}
}

class FakeIdGenerator implements IdGeneratorPort {
	private value = 0;
	generate() { return String(++this.value); }
}

const directPolicy = new FakePolicy((field) => ({
	field,
	mode: "direct",
	reasonCode: "administrative_change_allowed",
	requirements: ["reason", "audit_identity_change"],
}));

test("administrative update is policy evaluated, revision safe, and audited", async () => {
	const repository = new FakeStaffAdministrationRepository();
	const audit = new FakeAuditRepository();
	const useCase = new UpdateAdministrativeStaffUseCase(
		repository,
		directPolicy,
		audit,
		new FakeTransactionManager(),
		new FakeIdGenerator(),
	);

	const result = await useCase.execute({
		staffId: "staff-target",
		actorId: "staff-admin",
		actorOfficeId: "office-admin",
		actorUnitId: "unit-admin",
		changes: { employmentType: EmploymentType.CONTRACT },
		reason: "Approved contract conversion",
		expectedRevision: 3,
	});

	assert.equal(result.revision, 4);
	assert.equal(result.employmentType, EmploymentType.CONTRACT);
	assert.equal(audit.events[0]?.capability, "staff.update");
	assert.deepEqual(audit.events[0]?.metadata?.fields, ["employmentType"]);
});

test("status transition requires the capability appropriate to the target status", async () => {
	const repository = new FakeStaffAdministrationRepository();
	const audit = new FakeAuditRepository();
	const policy = new FakePolicy((field) => ({
		field,
		mode: "direct",
		reasonCode: "transition_allowed",
		requirements: ["reason", "target_must_not_be_actor"],
	}));
	const useCase = new TransitionStaffStatusUseCase(
		repository,
		policy,
		audit,
		new FakeTransactionManager(),
		new FakeIdGenerator(),
	);

	await assert.rejects(() => useCase.execute({
		staffId: "staff-target",
		actorId: "staff-admin",
		actorOfficeId: null,
		actorUnitId: null,
		actorCapabilities: ["staff.activate"],
		toStatus: Status.SUSPENDED,
		reason: "Pending investigation",
		expectedRevision: 3,
	}));

	const result = await useCase.execute({
		staffId: "staff-target",
		actorId: "staff-admin",
		actorOfficeId: null,
		actorUnitId: null,
		actorCapabilities: ["staff.deactivate"],
		toStatus: Status.SUSPENDED,
		reason: "Pending investigation",
		expectedRevision: 3,
	});
	assert.equal(result.status, Status.SUSPENDED);
	assert.equal(audit.events[0]?.capability, "staff.deactivate");
});

test("approved identity change is applied and the request is completed atomically", async () => {
	const requestRepository = new FakeIdentityChangeRequestRepository();
	requestRepository.requests.push({
		id: "request-1",
		requestGroupId: "group-1",
		identityId: "identity-target",
		staffId: "staff-target",
		fieldName: "lastName",
		previousValue: "Okafor",
		requestedValue: "Nwosu",
		reason: "Legal name change",
		evidenceMediaIds: ["media-1"],
		status: "pending",
		policyKey: "nexusfons_identity_governance",
		policyVersion: 1,
		decisionReasonCode: "legal_name_change_requires_approval",
		requestedAt: new Date(),
		reviewedBy: null,
		reviewedAt: null,
		reviewReason: null,
		appliedAt: null,
	});
	const staffRepository = new FakeStaffAdministrationRepository();
	const audit = new FakeAuditRepository();
	const approvalPolicy = new FakePolicy(
		(field) => ({
			field,
			mode: "approval_required",
			reasonCode: "legal_name_change_requires_approval",
			requirements: ["hr_approval"],
		}),
		"nexusfons_identity_governance",
	);
	const useCase = new ReviewIdentityChangeUseCase(
		requestRepository,
		staffRepository,
		new FakeStaffMediaRepository(),
		new FakeAuthService(),
		approvalPolicy,
		audit,
		new FakeTransactionManager(),
		new FakeIdGenerator(),
	);

	const result = await useCase.execute({
		requestId: "request-1",
		reviewerId: "staff-admin",
		reviewerOfficeId: null,
		reviewerUnitId: null,
		decision: "approve",
		reason: "Evidence verified",
	});

	assert.equal(result.status, "applied");
	assert.deepEqual(staffRepository.appliedIdentityChanges, [
		{ field: "lastName", value: "Nwosu" },
	]);
	assert.equal(requestRepository.requests[0]?.status, "applied");
	assert.equal(audit.events[0]?.capability, "identity.change.review");
});
