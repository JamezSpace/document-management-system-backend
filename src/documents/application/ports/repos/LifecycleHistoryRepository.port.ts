import type LifecycleHistory from "../../../domain/valueobjects/LifecycleHistory.js";

interface LifecycleHistoryRepositoryPort {
	save(payload:LifecycleHistory): Promise<void>;
}

export type {LifecycleHistoryRepositoryPort}