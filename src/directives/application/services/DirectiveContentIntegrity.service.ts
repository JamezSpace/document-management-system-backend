import { createHash } from "node:crypto";
import type { DirectiveRevisionInput } from "../../domain/directive.models.js";

class DirectiveContentIntegrityService {
	sha256(input: DirectiveRevisionInput): string {
		return createHash("sha256")
			.update(JSON.stringify({
				heading: input.heading,
				instruction: input.instruction,
				expectedOutcome: input.expectedOutcome,
				priority: input.priority,
				registryVolume: input.registryVolume,
				completionDueAt: input.completionDueAt?.toISOString() ?? null,
				sourceDocumentVersionId: input.sourceDocumentVersionId,
				targets: input.targets,
			}))
			.digest("hex");
	}
}

export default DirectiveContentIntegrityService;
