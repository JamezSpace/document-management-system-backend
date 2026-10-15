import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { MediaServicePort } from "../../../../shared/application/port/services/mediaService.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentSignatureRecord, DocumentSignatureRepositoryPort } from "../../ports/repos/DocumentSignatureRepository.port.js";
import type { DocumentGovernanceAuditPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";
import { documentContentSha256 } from "../../services/DocumentContentIntegrity.service.js";

class SignDocumentAsUnitHeadUseCase {
	constructor(
		private readonly ids: IdGeneratorPort,
		private readonly documents: DocumentRepositoryPort,
		private readonly signatures: DocumentSignatureRepositoryPort,
		private readonly contexts: DocumentGovernanceContextPort,
		private readonly transactionManager: TransactionManager,
		private readonly audit: DocumentGovernanceAuditPort,
		private readonly governance: DocumentGovernanceGuard,
		private readonly media: MediaServicePort,
	) {}

	async execute(documentId: string, actorStaffId: string, expectedRevision: number) {
		const document = await this.requireDocument(documentId);
		const version = document.getCurrentVersion();
		if (!version) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
			message: "A document must have saved content before it can be signed",
			details: { documentId },
		});
		await this.assertEffectiveUnitHead(documentId, actorStaffId, document);
		const contentSha256 = documentContentSha256(version.contentDelta);
		const signedAt = new Date();

		const result = await this.transactionManager.execute(async (tx) => {
			if (!(await this.documents.lockRevision(documentId, expectedRevision, tx))) throw this.stale(documentId, expectedRevision);
			await this.signatures.invalidateOutdated(documentId, version.id, contentSha256, signedAt, tx);
			const existing = await this.signatures.findEffectiveByDocument(documentId, version.id, tx);
			if (existing?.contentSha256 === contentSha256) {
				return { signature: existing, documentRevision: expectedRevision, created: false };
			}

			const signatureMedia = await this.signatures.findActiveStaffSignatureMedia(actorStaffId, tx);
			if (!signatureMedia) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "The signer must have an active signature image",
				details: { actorStaffId },
			});
			const format = signatureMedia.format.toLowerCase();
			if (format !== "svg") throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Signature images must be SVG",
				details: { mediaId: signatureMedia.id, format: signatureMedia.format },
			});

			const signature = await this.signatures.recordUnitHeadSignature({
				id: `DOC-SIGN-${this.ids.generate()}`,
				documentId,
				documentVersionId: version.id,
				signedRevision: expectedRevision,
				contentSha256,
				signatureMediaId: signatureMedia.id,
				signerName: signatureMedia.signerName,
				signerDesignation: signatureMedia.signerDesignation,
				signedBy: actorStaffId,
				signedAt,
			}, tx);
			const documentRevision = await this.documents.incrementRevision(documentId, expectedRevision, tx);
			if (!documentRevision) throw this.stale(documentId, expectedRevision);
			return { signature, documentRevision, created: true };
		});

		if (result.created) await this.audit.record({
			actorStaffId, documentId, action: "unit_head_signature", outcome: "success",
			reasonCode: "effective_unit_head_signed",
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
			obligations: ["audit_security_event"],
		});
		return { ...this.present(result.signature), documentRevision: result.documentRevision, created: result.created };
	}

	async list(documentId: string, actorStaffId: string) {
		const document = await this.requireDocument(documentId);
		await this.governance.authorize(document, actorStaffId, "view");
		return (await this.signatures.listByDocument(documentId)).map((signature) => {
			const currentVersionId = document.getCurrentVersion()?.id ?? null;
			const status = signature.status === "signed" && signature.documentVersionId !== currentVersionId
				? "invalidated" as const
				: signature.status;
			return { ...this.present(signature), status };
		});
	}

	async image(documentId: string, signatureId: string, actorStaffId: string) {
		const document = await this.requireDocument(documentId);
		await this.governance.authorize(document, actorStaffId, "view");
		const signature = await this.signatures.findById(signatureId);
		if (!signature || signature.documentId !== documentId || !signature.signatureMedia) {
			throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, { message: "Signature image was not found" });
		}
		const image = await this.media.readMedia(signature.signatureMedia);
		if (!image) throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, { message: "Signature image could not be loaded" });
		return { image, contentType: "image/svg+xml" };
	}

	async revoke(documentId: string, signatureId: string, reasonText: string, actorStaffId: string, expectedRevision: number) {
		const document = await this.requireDocument(documentId);
		await this.assertEffectiveUnitHead(documentId, actorStaffId, document);
		const reason = reasonText.trim();
		if (!reason) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "A revocation reason is required" });
		const revokedAt = new Date();
		const documentRevision = await this.transactionManager.execute(async (tx) => {
			if (!(await this.documents.lockRevision(documentId, expectedRevision, tx))) throw this.stale(documentId, expectedRevision);
			if (!(await this.signatures.revoke(signatureId, documentId, actorStaffId, revokedAt, reason, tx))) {
				throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "The signature is not active or does not belong to this document" });
			}
			const revision = await this.documents.incrementRevision(documentId, expectedRevision, tx);
			if (!revision) throw this.stale(documentId, expectedRevision);
			return revision;
		});
		await this.audit.record({
			actorStaffId, documentId, action: "unit_head_signature_revocation", outcome: "success",
			reasonCode: "effective_unit_head_signature_revoked",
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
			obligations: ["audit_security_event"],
		});
		return { documentId, signatureId, revokedBy: actorStaffId, revokedAt, reason, documentRevision };
	}

	private present(signature: DocumentSignatureRecord) {
		return {
			id: signature.id,
			documentId: signature.documentId,
			documentVersionId: signature.documentVersionId,
			signedRevision: signature.signedRevision,
			contentSha256: signature.contentSha256,
			signedBy: signature.signedBy,
			signerName: signature.signerName,
			signerDesignation: signature.signerDesignation,
			signedAt: signature.signedAt,
			status: signature.status,
			imageEndpoint: signature.signatureMedia
				? `/api/document/${encodeURIComponent(signature.documentId)}/signatures/${encodeURIComponent(signature.id)}/image`
				: null,
			revokedBy: signature.revokedBy,
			revokedAt: signature.revokedAt,
			revocationReason: signature.revocationReason,
			invalidatedAt: signature.invalidatedAt,
			invalidationReason: signature.invalidationReason,
		};
	}

	private async assertEffectiveUnitHead(documentId: string, actorStaffId: string, document: Awaited<ReturnType<SignDocumentAsUnitHeadUseCase["requireDocument"]>>) {
		const context = await this.contexts.resolve(documentId, actorStaffId);
		if (context.relationships.includes("unit_head") || context.relationships.includes("delegated_unit_head")) return;
		await this.audit.record({
			actorStaffId, documentId, action: "unit_head_signature", outcome: "denied",
			reasonCode: "effective_unit_head_required",
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
			obligations: ["audit_security_event"],
		});
		throw new ApplicationError(ApplicationErrorEnum.INVALID_DELEGATE, {
			message: "Only the effective Unit Head may sign or revoke a signature on this document",
			details: { documentId },
		});
	}

	private async requireDocument(documentId: string) {
		const document = await this.documents.findDocumentById(documentId);
		if (!document) throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
			message: `Document with id ${documentId} doesn't exist.`,
		});
		return document;
	}

	private stale(documentId: string, expectedRevision: number) {
		return new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
			message: "Document revision changed before the signature decision",
			details: { documentId, expectedRevision },
		});
	}
}

export default SignDocumentAsUnitHeadUseCase;
