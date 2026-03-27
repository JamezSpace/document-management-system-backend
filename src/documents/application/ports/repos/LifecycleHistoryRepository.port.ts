interface LifecycleHistoryRepositoryPort {
	save(payload: {
        id: string;
		documentId: string;
		documentVersionId?: string;
		fromState: string | null;
		toState: string;
		action: string;
		actorId: string;
		metadata?: Record<string, unknown>;
	}): Promise<void>;
}

export type {LifecycleHistoryRepositoryPort}