import type { Document } from "../../../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";
import type { ResolvedDocumentGovernanceContext } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

class DocumentCanvasProjector {
	static async project(
		document: Document,
		context: ResolvedDocumentGovernanceContext,
		policy: DocumentGovernancePolicyPort,
	) {
		const isInternalCanvas = document.correspondence.direction === "internal";
		const policyReference = {
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
		};

		const decision = await policy.evaluateAction(
			"render_cc_header",
			{
				sensitivity: document.classification.sensitivity,
				...context,
				isInternalCanvas,
			},
			policyReference,
		);

		const primaryAddressees = document.addressees.filter(
			(addressee) => addressee.isPrimary,
		);

		const visibleAddressees = decision.allowed
			? document.addressees
			: primaryAddressees;

		return {
			document: {
				id: document.id,
				ownerId: document.ownerId,
				title: document.title,
				currentVersion: document.getCurrentVersion(),
				referenceNumber: document.referenceNumber,
				revision: document.revision,
				addressees: visibleAddressees,
				classification: document.classification,
				correspondence: document.correspondence,
				retention: document.retention,
				createdAt: document.createdAt,
			},
			ccHeader: {
				visible: decision.allowed,
				placement: decision.allowed
					? isInternalCanvas
						? "internal_routing"
						: "letterhead_footer"
					: null,
				reasonCode: decision.reasonCode,
			},
		};
	}
}

export default DocumentCanvasProjector;
