import type { DocumentLifecyclePolicyState } from "../enum/documentLifecyclePolicy.enum.js";

interface LifecyclePolicyPort {
	assertTransitionAllowed(input: {
		documentId: string;
		currentState: DocumentLifecyclePolicyState;
		action: DocumentLifecyclePolicyState;
		actorId: string;
	}): void;
}

export type { LifecyclePolicyPort };
