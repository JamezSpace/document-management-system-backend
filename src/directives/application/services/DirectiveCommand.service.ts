import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type {
	Directive,
	DirectiveRevisionInput,
} from "../../domain/directive.models.js";
import { DirectiveCapabilities } from "../../domain/enum/directiveCapabilities.enum.js";
import type { DirectiveAudienceResolverPort } from "../ports/DirectiveAudienceResolver.port.js";
import type { DirectiveAuthorityResolverPort } from "../ports/DirectiveAuthorityResolver.port.js";
import type { DirectiveRepositoryPort } from "../ports/DirectiveRepository.port.js";
import DirectiveContentIntegrityService from "./DirectiveContentIntegrity.service.js";
import DirectivePolicyEvaluator from "./DirectivePolicyEvaluator.js";

interface RequestEvidence {
	requestId?: string;
	correlationId?: string;
}

class DirectiveCommandService {
	constructor(
		private readonly repository: DirectiveRepositoryPort,
		private readonly audienceResolver: DirectiveAudienceResolverPort,
		private readonly authorityResolver: DirectiveAuthorityResolverPort,
		private readonly transactions: TransactionManager,
		private readonly ids: IdGeneratorPort,
		private readonly policy = new DirectivePolicyEvaluator(),
		private readonly integrity = new DirectiveContentIntegrityService(),
	) {}

	async create(
		actor: ActorContext,
		input: {
			referenceNumber: string | null;
			acknowledgementRequired: boolean;
			completionRequired: boolean;
			revision: DirectiveRevisionInput;
		},
		evidence: RequestEvidence = {},
	): Promise<Directive> {
		this.policy.assertCapability(actor, DirectiveCapabilities.CREATE);
		this.assertTargets(input.revision);
		const now = new Date();
		const directiveId = this.id("DIR");
		const revisionId = this.id("DVR");

		return this.transactions.execute(async (tx) => {
			await this.repository.createDraft({
				id: directiveId,
				referenceNumber: input.referenceNumber,
				issuingUnitId: actor.unitId,
				issuingOfficeId: actor.officeId,
				acknowledgementRequired: input.acknowledgementRequired,
				completionRequired: input.completionRequired,
				createdAt: now,
			}, tx);
			await this.repository.createRevision({
				id: revisionId,
				directiveId,
				revisionNumber: 1,
				revision: input.revision,
				contentSha256: this.integrity.sha256(input.revision),
				supersedesRevisionId: null,
				changeReason: null,
				createdByStaffId: actor.staffId,
				createdAt: now,
			}, tx);
			await this.createTargets(revisionId, input.revision, actor.staffId, now, tx);
			if (!await this.repository.setCurrentRevision(directiveId, revisionId, 1, now, tx)) {
				this.stale(directiveId, 1);
			}
			await this.event(directiveId, revisionId, "created", actor, evidence, now, {}, tx);
			await this.event(directiveId, revisionId, "revision_created", actor, evidence, now, { revisionNumber: 1 }, tx);
			return (await this.repository.findById(directiveId, tx))!;
		});
	}

	async amend(
		actor: ActorContext,
		directiveId: string,
		expectedVersion: number,
		input: { revision: DirectiveRevisionInput; changeReason: string },
		evidence: RequestEvidence = {},
	): Promise<Directive> {
		this.assertTargets(input.revision);
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx, true);
			this.policy.assertCapability(actor, DirectiveCapabilities.UPDATE, directive);
			this.assertVersion(directive, expectedVersion);
			if (!directive.currentRevision || !["draft", "issued"].includes(directive.status)) {
				this.conflict("Only draft or issued directives can be amended", directiveId);
			}
			const now = new Date();
			const revisionId = this.id("DVR");
			const revisionNumber = directive.currentRevision.revisionNumber + 1;
			await this.repository.createRevision({
				id: revisionId,
				directiveId,
				revisionNumber,
				revision: input.revision,
				contentSha256: this.integrity.sha256(input.revision),
				supersedesRevisionId: directive.currentRevision.id,
				changeReason: input.changeReason,
				createdByStaffId: actor.staffId,
				createdAt: now,
			}, tx);
			await this.createTargets(revisionId, input.revision, actor.staffId, now, tx);
			if (!await this.repository.setCurrentRevision(directiveId, revisionId, expectedVersion, now, tx)) {
				this.stale(directiveId, expectedVersion);
			}
			if (directive.status === "issued") {
				await this.resolveAndDeliver(revisionId, now, tx);
			}
			await this.event(directiveId, revisionId, "amended", actor, evidence, now, {
				revisionNumber,
				changeReason: input.changeReason,
			}, tx);
			return (await this.repository.findById(directiveId, tx))!;
		});
	}

	async issue(
		actor: ActorContext,
		directiveId: string,
		expectedVersion: number,
		input: { referenceNumber: string; effectiveFrom: Date | null; effectiveUntil: Date | null },
		evidence: RequestEvidence = {},
	): Promise<Directive> {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx, true);
			const grant = this.policy.assertCapability(actor, DirectiveCapabilities.ISSUE, directive);
			this.assertVersion(directive, expectedVersion);
			if (directive.status !== "draft" || !directive.currentRevisionId) {
				this.conflict("Only a complete draft directive can be issued", directiveId);
			}
			const authority = await this.authorityResolver.resolve(actor.staffId, grant.assignmentId, tx);
			if (!authority) {
				throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, {
					message: "The issuing role assignment is no longer active",
				});
			}
			const now = new Date();
			const effectiveFrom = input.effectiveFrom ?? now;
			if (input.effectiveUntil && input.effectiveUntil <= effectiveFrom) {
				throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
					message: "effectiveUntil must be later than effectiveFrom",
				});
			}
			const audience = await this.audienceResolver.resolve(directive.currentRevisionId, tx);
			if (audience.length === 0) {
				throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
					message: "The directive targets do not resolve to any active staff recipients",
				});
			}
			if (!await this.repository.issue({
				directiveId,
				expectedVersion,
				referenceNumber: input.referenceNumber,
				authority,
				issuedAt: now,
				effectiveFrom,
				effectiveUntil: input.effectiveUntil,
			}, tx)) this.stale(directiveId, expectedVersion);
			await this.persistDeliveries(directive.currentRevisionId, audience, now, tx);
			await this.event(directiveId, directive.currentRevisionId, "issued", actor, evidence, now, {
				referenceNumber: input.referenceNumber,
				assignmentId: grant.assignmentId,
			}, tx);
			await this.event(directiveId, directive.currentRevisionId, "audience_resolved", actor, evidence, now, {
				recipientCount: audience.length,
			}, tx);
			return (await this.repository.findById(directiveId, tx))!;
		});
	}

	async withdraw(actor: ActorContext, directiveId: string, expectedVersion: number, reason: string, evidence: RequestEvidence = {}) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx, true);
			this.policy.assertCapability(actor, DirectiveCapabilities.WITHDRAW, directive);
			this.assertVersion(directive, expectedVersion);
			if (directive.status !== "issued") this.conflict("Only issued directives can be withdrawn", directiveId);
			const now = new Date();
			if (!await this.repository.withdraw({ directiveId, expectedVersion, staffId: actor.staffId, reason, occurredAt: now }, tx)) {
				this.stale(directiveId, expectedVersion);
			}
			await this.event(directiveId, directive.currentRevisionId, "withdrawn", actor, evidence, now, { reason }, tx);
			return (await this.repository.findById(directiveId, tx))!;
		});
	}

	async complete(actor: ActorContext, directiveId: string, expectedVersion: number, evidence: RequestEvidence = {}) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx, true);
			this.policy.assertCapability(actor, DirectiveCapabilities.ENFORCE, directive);
			this.assertVersion(directive, expectedVersion);
			if (directive.status !== "issued") this.conflict("Only issued directives can be completed", directiveId);
			if (directive.completionRequired && !await this.repository.hasAcceptedEvidence(directiveId, tx)) {
				this.conflict("Completion requires accepted evidence", directiveId);
			}
			const now = new Date();
			if (!await this.repository.complete({ directiveId, expectedVersion, staffId: actor.staffId, occurredAt: now }, tx)) {
				this.stale(directiveId, expectedVersion);
			}
			await this.event(directiveId, directive.currentRevisionId, "completed", actor, evidence, now, {}, tx);
			return (await this.repository.findById(directiveId, tx))!;
		});
	}

	async markSeen(actor: ActorContext, directiveId: string, evidence: RequestEvidence = {}) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx);
			if (!directive.currentRevisionId || !await this.repository.isRecipient(directive.currentRevisionId, actor.staffId, tx)) {
				throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "The actor is not a recipient of this directive revision" });
			}
			const now = new Date();
			const changed = await this.repository.markSeen(directive.currentRevisionId, actor.staffId, now, tx);
			if (changed) await this.event(directiveId, directive.currentRevisionId, "seen", actor, evidence, now, {}, tx);
			return { seenAt: now, alreadySeen: !changed };
		});
	}

	async acknowledge(actor: ActorContext, directiveId: string, statement: string | null, evidence: RequestEvidence = {}) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx);
			if (!directive.acknowledgementRequired) this.conflict("This directive does not require acknowledgement", directiveId);
			if (!directive.currentRevisionId || !await this.repository.isRecipient(directive.currentRevisionId, actor.staffId, tx)) {
				throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "The actor is not a recipient of this directive revision" });
			}
			const now = new Date();
			const id = this.id("DAK");
			if (!await this.repository.acknowledge({ id, directiveRevisionId: directive.currentRevisionId, staffId: actor.staffId, statement, acknowledgedAt: now }, tx)) {
				this.conflict("This directive revision has already been acknowledged", directiveId);
			}
			await this.event(directiveId, directive.currentRevisionId, "acknowledged", actor, evidence, now, { acknowledgementId: id }, tx);
			return { id, acknowledgedAt: now };
		});
	}

	async addEvidence(actor: ActorContext, directiveId: string, input: { documentVersionId: string | null; mediaAssetId: string | null; description: string | null }, request: RequestEvidence = {}) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx);
			this.policy.assertCapability(actor, DirectiveCapabilities.ROUTE, directive);
			if (!directive.currentRevisionId || !["issued", "completed"].includes(directive.status)) {
				this.conflict("Evidence can only be attached to issued directives", directiveId);
			}
			if (Number(Boolean(input.documentVersionId)) + Number(Boolean(input.mediaAssetId)) !== 1) {
				throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "Supply exactly one documentVersionId or mediaAssetId" });
			}
			const now = new Date();
			const id = this.id("DCE");
			await this.repository.addEvidence({ id, directiveId, directiveRevisionId: directive.currentRevisionId, ...input, submittedByStaffId: actor.staffId, submittedAt: now }, tx);
			await this.event(directiveId, directive.currentRevisionId, "completion_evidence_added", actor, request, now, { evidenceId: id }, tx);
			return { id, submittedAt: now };
		});
	}

	async acceptEvidence(actor: ActorContext, directiveId: string, evidenceId: string, note: string | null) {
		return this.transactions.execute(async (tx) => {
			const directive = await this.requireDirective(directiveId, tx);
			this.policy.assertCapability(actor, DirectiveCapabilities.ENFORCE, directive);
			const evidence = (await this.repository.listEvidence(directiveId)).find((item) => item.id === evidenceId);
			if (!evidence) throw new ApplicationError(ApplicationErrorEnum.DIRECTIVE_EVIDENCE_NOT_FOUND, { message: "Directive completion evidence was not found" });
			if (evidence.acceptance) this.conflict("Completion evidence has already been accepted", directiveId);
			const now = new Date();
			const id = this.id("DCA");
			if (!await this.repository.acceptEvidence({ id, evidenceId, acceptedByStaffId: actor.staffId, acceptedAt: now, note }, tx)) {
				this.conflict("Completion evidence has already been accepted", directiveId);
			}
			return { id, acceptedAt: now };
		});
	}

	private async createTargets(revisionId: string, revision: DirectiveRevisionInput, staffId: string, now: Date, tx: Parameters<DirectiveRepositoryPort["createTargets"]>[4]) {
		await this.repository.createTargets(
			revisionId,
			revision.targets.map((target) => ({ id: this.id("DTT"), target })),
			staffId,
			now,
			tx,
		);
	}

	private async resolveAndDeliver(revisionId: string, now: Date, tx: Parameters<DirectiveAudienceResolverPort["resolve"]>[1]) {
		const audience = await this.audienceResolver.resolve(revisionId, tx);
		if (audience.length === 0) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "The amended targets do not resolve to active staff" });
		await this.persistDeliveries(revisionId, audience, now, tx);
	}

	private async persistDeliveries(revisionId: string, audience: Awaited<ReturnType<DirectiveAudienceResolverPort["resolve"]>>, now: Date, tx: Parameters<DirectiveRepositoryPort["createDeliveries"]>[3]) {
		await this.repository.createDeliveries(
			revisionId,
			audience.map((member) => ({
				...member,
				deliveryId: this.id("DDL"),
				sourceIds: member.sources.map(() => this.id("DDS")),
			})),
			now,
			tx,
		);
	}

	private async requireDirective(id: string, tx?: Parameters<DirectiveRepositoryPort["findById"]>[1], forUpdate = false) {
		const directive = await this.repository.findById(id, tx, forUpdate);
		if (!directive) throw new ApplicationError(ApplicationErrorEnum.DIRECTIVE_NOT_FOUND, { message: "Directive was not found", details: { directiveId: id } });
		return directive;
	}

	private async event(directiveId: string, revisionId: string | null, eventType: string, actor: ActorContext, evidence: RequestEvidence, occurredAt: Date, metadata: Record<string, unknown>, tx: Parameters<DirectiveRepositoryPort["appendEvent"]>[1]) {
		await this.repository.appendEvent({
			id: this.id("DEV"), directiveId, directiveRevisionId: revisionId,
			eventType, actorStaffId: actor.staffId,
			actorAssignmentId: null, correlationId: evidence.correlationId ?? evidence.requestId ?? null,
			metadata, occurredAt,
		}, tx);
	}

	private assertVersion(directive: Directive, expected: number) {
		if (directive.version !== expected) this.stale(directive.id, expected);
	}

	private assertTargets(revision: DirectiveRevisionInput) {
		if (revision.targets.length === 0) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "A directive revision requires at least one target" });
	}

	private stale(directiveId: string, expectedVersion: number): never {
		throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
			message: "Directive version no longer matches the supplied If-Match value",
			details: { directiveId, expectedVersion },
		});
	}

	private conflict(message: string, directiveId: string): never {
		throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message, details: { directiveId } });
	}

	private id(prefix: string) { return `${prefix}-${this.ids.generate()}`; }
}

export { type RequestEvidence };
export default DirectiveCommandService;
